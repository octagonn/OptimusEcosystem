"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Minimize2, ExternalLink, Hash, Radio } from "lucide-react";
import { useGroupChat } from "@/app/state/groupChatStore";
import { useFacilityStream } from "@/app/lib/useFacilityStream";
import { AGENT_PROFILES } from "@/app/lib/agentProfiles";
import { AGENTS, type AgentName } from "@optimus/shared";

const AX_VIEW_URL = process.env.NEXT_PUBLIC_AX_VIEW_URL ?? "https://paxai.app/";

export default function GroupComms() {
  useFacilityStream();
  const open = useGroupChat((s) => s.open);
  const setOpen = useGroupChat((s) => s.setOpen);
  const seed = useGroupChat((s) => s.composerSeed);
  const setSeed = useGroupChat((s) => s.setSeed);
  const messages = useGroupChat((s) => s.messages);
  const tasks = useGroupChat((s) => s.tasks);
  const activity = useGroupChat((s) => s.activity);

  const [tab, setTab] = useState<"comms" | "ax">("comms");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // External "open with agent tag" callers (canvas, rail) push a seed
  useEffect(() => {
    if (!seed) return;
    setDraft((d) => (d.includes(seed) ? d : `${seed} ${d}`.trim() + " "));
    setSeed("");
    setTimeout(() => taRef.current?.focus(), 30);
  }, [seed, setSeed]);

  // Autoscroll to bottom on new messages
  useEffect(() => {
    if (!open || tab !== "comms") return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, open, tab]);

  // Live tasks summary
  const live = useMemo(
    () => tasks.filter((t) => t.status === "assigned" || t.status === "in_progress" || t.status === "escalated"),
    [tasks],
  );

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        // Surface failure inline so we never silently eat input
        useGroupChat.getState().appendMessage({
          id: `err-${Date.now()}`,
          channel: "comms",
          from: "system",
          agent: null,
          display: "system",
          text: `send failed (${res.status})`,
          mentions: [],
          ts: Date.now(),
        });
      }
    } catch (err) {
      useGroupChat.getState().appendMessage({
        id: `err-${Date.now()}`,
        channel: "comms",
        from: "system",
        agent: null,
        display: "system",
        text: `network error: ${err instanceof Error ? err.message : "unknown"}`,
        mentions: [],
        ts: Date.now(),
      });
    } finally {
      setSending(false);
    }
  };

  // Hidden when collapsed — only opens via left rail icon or sprite click
  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[440px] h-[640px] flex flex-col rounded-lg overflow-hidden border border-[#1A2233] bg-[#070A11]/97 backdrop-blur-md shadow-2xl"
      style={{ boxShadow: "0 30px 80px -30px #000, 0 0 0 1px #1A2233" }}
    >
      {/* Header */}
      <div className="flex items-center px-3 h-10 border-b border-[#1A2233] shrink-0">
        <Hash size={12} className="text-[#C1121F]" />
        <span className="ml-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#C1121F]">
          comms
        </span>
        <span className="ml-2 text-[9px] font-mono text-[#3A4A60] uppercase tracking-wider">
          // 6 agents · {messages.length} msgs · {live.length} live
        </span>

        {/* Tabs */}
        <div className="ml-auto flex items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setTab("comms")}
            className={`px-2 h-6 rounded-sm ${tab === "comms" ? "bg-[#1A2233] text-[#D8DEE9]" : "text-[#4A5568] hover:text-[#8A94A8]"}`}
          >
            chat
          </button>
          <button
            type="button"
            onClick={() => setTab("ax")}
            className={`px-2 h-6 rounded-sm flex items-center gap-1 ${tab === "ax" ? "bg-[#1A2233] text-[#D8DEE9]" : "text-[#4A5568] hover:text-[#8A94A8]"}`}
          >
            ax <ExternalLink size={9} />
          </button>
        </div>

        <button
          onClick={() => setOpen(false)}
          type="button"
          className="ml-2 p-1 rounded text-[#4A5568] hover:text-[#8A94A8]"
          aria-label="Minimize"
        >
          <Minimize2 size={13} />
        </button>
      </div>

      {/* Mention chips */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1A2233] shrink-0 overflow-x-auto">
        {AGENTS.map((a) => {
          const p = AGENT_PROFILES[a as AgentName];
          const lit = activity[a] && Date.now() - activity[a] < 2_500;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setSeed(`@${a}`)}
              title={`Tag ${p.name}`}
              className="shrink-0 px-2 h-6 rounded text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1"
              style={{
                color: p.accentHex,
                backgroundColor: lit ? `${p.accentHex}30` : `${p.accentHex}12`,
                border: `1px solid ${p.accentHex}${lit ? "80" : "40"}`,
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: lit ? p.accentHex : `${p.accentHex}80` }}
              />
              @{p.handle.replace("optimus-", "")}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {tab === "comms" ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 font-mono text-[11.5px]">
            {messages.length === 0 && (
              <div className="text-center text-[#3A4A60] text-[10px] uppercase tracking-wider mt-8">
                channel quiet — tag an agent to begin
              </div>
            )}
            {messages.map((m) => (
              <MessageRow key={m.id} msg={m} />
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-[#1A2233] p-2 shrink-0">
            <div className="flex items-end gap-2 rounded border border-[#1A2233] bg-[#0B1220] focus-within:border-[#C1121F]/50 transition-colors">
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="message #comms — tag with @optimus-prime, @optimus-forge…"
                className="flex-1 bg-transparent px-3 py-2 text-[11.5px] font-mono text-[#D8DEE9] placeholder:text-[#3A4A60] resize-none outline-none max-h-32"
              />
              <button
                onClick={() => void send()}
                disabled={!draft.trim() || sending}
                type="button"
                className="m-1 p-1.5 rounded text-[#C1121F] bg-[#C1121F]/15 hover:bg-[#C1121F]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Send"
              >
                <Send size={13} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1 px-1">
              <span className="text-[9px] font-mono text-[#3A4A60] uppercase tracking-wider">
                ⏎ send · ⇧⏎ newline · @ to tag
              </span>
              <span className="text-[9px] font-mono text-[#3A4A60] uppercase tracking-wider">
                routed via /api/chat
              </span>
            </div>
          </div>
        </>
      ) : (
        <AxBridgePanel />
      )}
    </div>
  );
}

function MessageRow({ msg }: { msg: import("@/app/lib/types").ChatMessage }) {
  const time = new Date(msg.ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (msg.from === "system") {
    return (
      <div className="text-[10px] font-mono text-[#5D6B82] border-l-2 border-[#C1121F]/40 bg-[#C1121F]/05 pl-2 py-1 rounded-sm">
        <span className="text-[#C1121F]/80">{msg.display}</span>
        <span className="ml-2 text-[#3A4A60]">{time}</span>
        <div className="mt-0.5 text-[#8A94A8]">{renderText(msg.text)}</div>
      </div>
    );
  }

  if (msg.from === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-md px-3 py-2 bg-[#1A2233] text-[#D8DEE9] whitespace-pre-wrap break-words">
          <div className="text-[9px] uppercase tracking-wider text-[#8A94A8]">
            you · {time}
          </div>
          <div className="mt-0.5">{renderText(msg.text)}</div>
        </div>
      </div>
    );
  }

  // agent
  const p = msg.agent ? AGENT_PROFILES[msg.agent] : null;
  const accent = p?.accentHex ?? "#8A94A8";
  return (
    <div className="flex">
      <div
        className="max-w-[88%] rounded-md px-3 py-2 whitespace-pre-wrap break-words border"
        style={{
          backgroundColor: `${accent}10`,
          borderColor: `${accent}30`,
          color: accent,
        }}
      >
        <div className="text-[9px] uppercase tracking-wider" style={{ color: `${accent}cc` }}>
          @{msg.display} · {time}
        </div>
        <div className="mt-0.5 text-[#D8DEE9]">{renderText(msg.text)}</div>
      </div>
    </div>
  );
}

interface AxStatus {
  enabled: boolean;
  configured: boolean;
  running: boolean;
  agents: Array<{ agent: AgentName; running: boolean; startedAt: number | null; lastError: string | null }>;
  spaceId: string;
  startupError: string | null;
  probe: { ok: boolean; detail: string } | null;
}

function AxBridgePanel() {
  const [status, setStatus] = useState<AxStatus | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = async () => {
    try {
      const r = await fetch("/api/ax/status", { cache: "no-store" });
      if (r.ok) setStatus(await r.json());
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 5_000);
    return () => clearInterval(id);
  }, []);

  const reconnect = async () => {
    setPending(true);
    try {
      await fetch("/api/ax/status", { method: "POST" });
      await refresh();
    } finally {
      setPending(false);
    }
  };

  const pill = !status
    ? { label: "checking…", tone: "#5D6B82" }
    : status.running
    ? { label: "live", tone: "#45D6FF" }
    : status.configured
    ? { label: "reachable · idle", tone: "#FFB93F" }
    : { label: "not configured", tone: "#5D6B82" };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-[10px] font-mono text-[#5D6B82] uppercase tracking-wider border-b border-[#1A2233] flex items-center gap-2">
        <Radio size={11} style={{ color: pill.tone }} />
        <span>ax platform bridge</span>
        <span
          className="ml-auto px-2 py-0.5 rounded-sm text-[9px] tracking-wider"
          style={{ color: pill.tone, backgroundColor: `${pill.tone}18`, border: `1px solid ${pill.tone}40` }}
        >
          {pill.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 font-mono text-[11px] text-[#D8DEE9]">
        <p className="text-[#8A94A8] leading-relaxed">
          AX won&apos;t render inside an iframe — its OAuth flow blocks embedding.
          Launch the platform in a dedicated tab instead:
        </p>

        <a
          href={AX_VIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded border border-[#C1121F]/50 text-[#C1121F] bg-[#C1121F]/10 hover:bg-[#C1121F]/20 transition-colors text-[11px] uppercase tracking-wider"
        >
          <ExternalLink size={12} />
          launch ax platform
        </a>

        <div className="mt-4 border-t border-[#1A2233] pt-3">
          <div className="text-[10px] uppercase tracking-wider text-[#5D6B82] mb-2">bridge status</div>
          {status ? (
            <div className="space-y-1.5">
              <StatusRow k="enabled" v={status.enabled ? "yes" : "no (AX_ENABLED=off)"} />
              <StatusRow k="space" v={status.spaceId || "— (set AX_SPACE_ID)"} />
              <StatusRow k="cli probe" v={status.probe?.ok ? "ok" : status.probe?.detail ? status.probe.detail : "pending"} dim={!status.probe?.ok} />
              {status.startupError && (
                <div className="text-[#FF6B6B]">startup: {status.startupError}</div>
              )}
              <div className="mt-2 text-[10px] uppercase tracking-wider text-[#5D6B82]">listeners</div>
              <div className="grid grid-cols-2 gap-1">
                {status.agents.map((a) => (
                  <div key={a.agent} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: a.running ? "#45D6FF" : "#3A4A60" }}
                    />
                    <span className="text-[#8A94A8]">@{a.agent.replace("optimus-", "")}</span>
                    {a.lastError && (
                      <span title={a.lastError} className="text-[#FF6B6B] text-[9px]">!</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[#5D6B82]">loading…</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void reconnect()}
          disabled={pending}
          className="mt-2 inline-flex items-center gap-1.5 h-7 px-2 rounded border border-[#1A2233] text-[#8A94A8] hover:text-[#D8DEE9] hover:border-[#2A3A54] disabled:opacity-40 text-[10px] uppercase tracking-wider"
        >
          {pending ? "reconnecting…" : "retry connect"}
        </button>

        <div className="text-[9px] text-[#3A4A60] uppercase tracking-wider leading-relaxed">
          set <span className="text-[#5D6B82]">AX_TOKEN</span> +{" "}
          <span className="text-[#5D6B82]">AX_SPACE_ID</span> in .env.local,
          run <span className="text-[#5D6B82]">ax auth login</span> once, and the
          bridge will spawn one <span className="text-[#5D6B82]">ax listen</span>{" "}
          process per agent. bot chat in this panel mirrors out via{" "}
          <span className="text-[#5D6B82]">ax send</span>.
        </div>
      </div>
    </div>
  );
}

function StatusRow({ k, v, dim }: { k: string; v: string; dim?: boolean }) {
  return (
    <div className="flex gap-2 text-[10px]">
      <span className="text-[#5D6B82] uppercase tracking-wider w-20 shrink-0">{k}</span>
      <span className={dim ? "text-[#8A94A8] break-all" : "text-[#D8DEE9] break-all"}>{v}</span>
    </div>
  );
}

function renderText(text: string) {
  // Highlight @mentions and #task tokens
  const parts = text.split(/(\s)/);
  return parts.map((part, i) => {
    if (part.startsWith("@optimus-")) {
      const handle = part.slice(1).split(/[^a-z-]/i)[0] as AgentName;
      const p = AGENT_PROFILES[handle];
      const color = p?.accentHex ?? "#D8DEE9";
      return (
        <span
          key={i}
          className="px-1 rounded-sm"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {part}
        </span>
      );
    }
    if (part.startsWith("#task:") || part.startsWith("#status:") || part.startsWith("#")) {
      return (
        <span key={i} className="text-[#45D6FF]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
