/**
 * AX CLI bridge — wires `ax listen` (inbound) and `ax send` (outbound) to
 * the facility event bus. We shell out to the `ax` CLI rather than
 * hand-rolling HTTP calls so credential/fingerprint handling stays in the
 * one place that already owns it.
 *
 * Outbound mirror: every agent chat emitted by the orchestrator is also
 * posted to AX as that agent, so the upstream space mirrors what the
 * facility shows locally.
 *
 * Inbound listener: one `ax listen --json` subprocess per agent. NDJSON
 * events → ChatMessage → emitChat (marked `fromAx: true` so the outbound
 * mirror doesn't re-echo).
 *
 * No-op safe: if `ax` isn't installed, isn't authed, or the agents don't
 * exist in the space, we surface the error via getAxBridgeStatus() and
 * keep the app in mock mode rather than crashing.
 *
 * ─── Pre-gateway stopgap notice ─────────────────────────────────────
 * This module is the "subprocess" implementation of the
 * `GatewayEventSource` seam defined in ./gatewayEventSource.ts. When aX
 * Gateway phase 3 (telemetry) lands, this file's responsibilities move
 * behind a typed SSE client; defensive field-hunting in handleListenLine()
 * goes away. See PLAN.md §5.5.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { AGENTS, type AgentName } from "@optimus/shared";
import type { ChatMessage } from "./types";

// Resolved lazily to avoid a circular import with orchestrator.ts.
type EmitChat = (msg: ChatMessage) => Promise<void>;
let emitChatRef: EmitChat | null = null;
export function registerAxEmitChat(fn: EmitChat): void {
  emitChatRef = fn;
}

const AX_BIN = process.env.AX_BIN ?? "ax";
const AX_SPACE_ID = process.env.AX_SPACE_ID ?? "";
const AX_TOKEN = process.env.AX_TOKEN ?? ""; // CLI-style token, if set in app env
const AX_ENABLED = (process.env.AX_ENABLED ?? "auto").toLowerCase();

interface ListenerHandle {
  agent: AgentName;
  proc: ChildProcess;
  startedAt: number;
  buffer: string;
  lastError: string | null;
}

interface BridgeState {
  listeners: Map<AgentName, ListenerHandle>;
  sendQueue: Array<{ agent: AgentName; text: string }>;
  sending: boolean;
  lastStartAttempt: number;
  startupError: string | null;
  probeResult: { ok: boolean; detail: string } | null;
}

const g = globalThis as unknown as { __optimusAxBridge?: BridgeState };
const state: BridgeState = g.__optimusAxBridge ?? {
  listeners: new Map(),
  sendQueue: [],
  sending: false,
  lastStartAttempt: 0,
  startupError: null,
  probeResult: null,
};
g.__optimusAxBridge = state;

// ─── Config detection ──────────────────────────────────────────────

export function isAxBridgeEnabled(): boolean {
  if (AX_ENABLED === "off" || AX_ENABLED === "false") return false;
  // "auto" or "on" — we optimistically try; probe result gates actual spawn.
  return true;
}

export function getAxBridgeStatus(): {
  enabled: boolean;
  configured: boolean;
  running: boolean;
  agents: Array<{ agent: AgentName; running: boolean; startedAt: number | null; lastError: string | null }>;
  spaceId: string;
  startupError: string | null;
  probe: { ok: boolean; detail: string } | null;
} {
  const enabled = isAxBridgeEnabled();
  const agents = AGENTS.map((a) => {
    const h = state.listeners.get(a as AgentName);
    return {
      agent: a as AgentName,
      running: Boolean(h && !h.proc.killed),
      startedAt: h ? h.startedAt : null,
      lastError: h ? h.lastError : null,
    };
  });
  const running = agents.some((a) => a.running);
  return {
    enabled,
    configured: Boolean(AX_SPACE_ID),
    running,
    agents,
    spaceId: AX_SPACE_ID,
    startupError: state.startupError,
    probe: state.probeResult,
  };
}

// ─── Probe: does `ax` work at all? ────────────────────────────────

function probeAxCli(): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const env = { ...process.env };
    if (AX_TOKEN) env.AX_TOKEN = AX_TOKEN;
    const p = spawn(AX_BIN, ["agents", "list"], { env, shell: true });
    let out = "";
    let err = "";
    p.stdout?.on("data", (d) => (out += d.toString()));
    p.stderr?.on("data", (d) => (err += d.toString()));
    p.on("error", (e) => resolve({ ok: false, detail: `spawn error: ${e.message}` }));
    p.on("close", (code) => {
      const combined = (out + err).trim();
      if (code === 0) resolve({ ok: true, detail: combined.slice(0, 200) });
      else resolve({ ok: false, detail: combined.slice(0, 200) || `exit ${code}` });
    });
  });
}

// ─── Listener: `ax listen --json --agent <name>` ───────────────────

function spawnListenerFor(agent: AgentName): ListenerHandle | null {
  const args = ["listen", "--json", "--agent", agent];
  if (AX_SPACE_ID) args.push("--space-id", AX_SPACE_ID);
  const env = { ...process.env };
  if (AX_TOKEN) env.AX_TOKEN = AX_TOKEN;

  const proc = spawn(AX_BIN, args, { env, shell: true });
  const handle: ListenerHandle = {
    agent,
    proc,
    startedAt: Date.now(),
    buffer: "",
    lastError: null,
  };

  proc.stdout?.on("data", (chunk: Buffer) => {
    handle.buffer += chunk.toString("utf8");
    let nl = handle.buffer.indexOf("\n");
    while (nl >= 0) {
      const line = handle.buffer.slice(0, nl).trim();
      handle.buffer = handle.buffer.slice(nl + 1);
      if (line) handleListenLine(agent, line);
      nl = handle.buffer.indexOf("\n");
    }
  });
  proc.stderr?.on("data", (chunk: Buffer) => {
    handle.lastError = chunk.toString("utf8").slice(0, 400);
  });
  proc.on("error", (e) => {
    handle.lastError = `spawn error: ${e.message}`;
  });
  proc.on("close", (code) => {
    handle.lastError = `${handle.lastError ?? ""} [exit ${code}]`.trim();
    // If this was the current handle for the agent, clear it so a future
    // ensureAxBridgeStarted() can respawn rather than see a ghost entry.
    const cur = state.listeners.get(agent);
    if (cur === handle) state.listeners.delete(agent);
  });

  return handle;
}

function handleListenLine(agent: AgentName, line: string): void {
  // `ax listen --json` emits one event per line. Shape isn't formally typed
  // here; we defensively pull the fields we care about and ignore the rest.
  let evt: Record<string, unknown>;
  try {
    evt = JSON.parse(line);
  } catch {
    return;
  }
  const content = extractString(evt, ["content", "text", "body", "message"]);
  if (!content) return;
  const sender =
    extractString(evt, ["from", "sender", "author", "agent"]) ?? "ax";

  // We skip echo-back: if AX re-emits a message we ourselves just posted,
  // the `fromAx: true` flag stops it from being mirrored out again.
  const msg: ChatMessage = {
    id: `AX-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    channel: "comms",
    from: "agent",
    agent,
    display: agent.replace("optimus-", ""),
    text: `[from ax:${sender}] ${content}`.slice(0, 2000),
    mentions: [],
    ts: Date.now(),
    taskId: null,
    fromAx: true,
  };
  if (emitChatRef) void emitChatRef(msg);
}

function extractString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
      const s = extractString(v as Record<string, unknown>, keys);
      if (s) return s;
    }
  }
  return null;
}

// ─── Send: `ax send --agent <name> --content <text>` ───────────────

export function sendToAx(agent: AgentName, text: string): void {
  if (!isAxBridgeEnabled()) return;
  state.sendQueue.push({ agent, text });
  void drainSendQueue();
}

async function drainSendQueue(): Promise<void> {
  if (state.sending) return;
  state.sending = true;
  try {
    while (state.sendQueue.length > 0) {
      const item = state.sendQueue.shift();
      if (!item) break;
      await runSend(item.agent, item.text).catch(() => { /* best-effort */ });
    }
  } finally {
    state.sending = false;
  }
}

function runSend(agent: AgentName, text: string): Promise<void> {
  return new Promise((resolve) => {
    const args = ["send", "--agent", agent, "--content", text];
    if (AX_SPACE_ID) args.push("--space-id", AX_SPACE_ID);
    const env = { ...process.env };
    if (AX_TOKEN) env.AX_TOKEN = AX_TOKEN;
    const p = spawn(AX_BIN, args, { env, shell: true });
    p.on("error", () => resolve());
    p.on("close", () => resolve());
  });
}

// ─── Lifecycle ─────────────────────────────────────────────────────

let startPromise: Promise<void> | null = null;

export function ensureAxBridgeStarted(): Promise<void> {
  if (!isAxBridgeEnabled()) return Promise.resolve();
  if (startPromise) return startPromise;
  startPromise = (async () => {
    state.lastStartAttempt = Date.now();
    state.startupError = null;
    const probe = await probeAxCli();
    state.probeResult = probe;
    if (!probe.ok) {
      state.startupError = probe.detail;
      return; // keep facility in mock mode, surface status in UI
    }
    // CLI works — spawn one listener per agent (skip any already running).
    for (const a of AGENTS) {
      const agent = a as AgentName;
      const existing = state.listeners.get(agent);
      if (existing && !existing.proc.killed) continue;
      const handle = spawnListenerFor(agent);
      if (handle) state.listeners.set(agent, handle);
    }
  })().catch((e) => {
    state.startupError = e instanceof Error ? e.message : String(e);
  }).finally(() => {
    // Let the next ensure() retry from scratch after 30s so transient
    // auth/network issues don't leave us permanently disabled.
    setTimeout(() => {
      startPromise = null;
    }, 30_000);
  });
  return startPromise;
}

export function stopAxBridge(): void {
  for (const h of state.listeners.values()) {
    try { h.proc.kill(); } catch { /* noop */ }
  }
  state.listeners.clear();
  state.sendQueue.length = 0;
}
