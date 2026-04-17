import { AGENTS, type AgentName } from "@optimus/shared";
import { publish } from "./eventBus";
import { getTask, listTasks, pushMessage, upsertTask } from "./store";
import type { ChatMessage, Task, TaskQuestion, TaskStatus } from "./types";
import { ensureAxBridgeStarted, registerAxEmitChat, sendToAx } from "./axBridge";

const AGENT_SET = new Set<string>(AGENTS);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Watchdog config ───────────────────────────────────────────
// Hard cap on auto-remediation: one probe, one escalation, then hand
// off to the user via a question on the task. This prevents PRIME from
// endlessly re-engaging a dead task and burning tokens in a loop.
const TICK_MS = 6_000;
const PROBE_AFTER_ASSIGNED = 25_000;
const ESCALATE_AFTER_ASSIGNED = 55_000;
const PROBE_AFTER_IN_PROGRESS = 90_000;
const ESCALATE_AFTER_IN_PROGRESS = 180_000;
const BLOCK_AFTER_ESCALATED = 45_000;
const MAX_ESCALATIONS = 1;

// Re-installable so HMR reloads pick up the new watchdog closure rather than
// running a stale function reference left on the global timer.
const g = globalThis as unknown as { __optimusOrchestrator?: { timer: NodeJS.Timeout | null } };
const orch = g.__optimusOrchestrator ?? { timer: null };
g.__optimusOrchestrator = orch;

export function ensureOrchestrator(): void {
  if (orch.timer) clearInterval(orch.timer);
  orch.timer = setInterval(() => {
    void watchdogTick();
  }, TICK_MS);
  // Boot the AX CLI bridge on first tick so inbound @mentions reach the
  // facility and outbound agent chat mirrors to the AX platform.
  registerAxEmitChat(emitChat);
  void ensureAxBridgeStarted();
}

// ─── Public surface ────────────────────────────────────────────

export function parseMentions(text: string): AgentName[] {
  const mentions: AgentName[] = [];
  const seen = new Set<string>();
  const re = /@(optimus-(?:prime|forge|anvil|nova|lore|scout))/gi;
  for (const m of text.matchAll(re)) {
    const handle = m[1].toLowerCase();
    if (AGENT_SET.has(handle) && !seen.has(handle)) {
      seen.add(handle);
      mentions.push(handle as AgentName);
    }
  }
  return mentions;
}

// ─── Collaboration detection ───────────────────────────────────
//
// The goal: any task (or chat routing) that implicates agents beyond
// the assignee should actually hear from those agents. Previously the
// assignee ran a solo mock-progression and the rest of the swarm stayed
// silent — tasks like "reach out to each agent for a reply" looked dead.
//
// Priority order:
//   1. Explicit @optimus-* handles in title + body
//   2. Bare short names (e.g. "ask forge" or "nova should weigh in")
//   3. Broadcast phrasing ("each agent", "the team", "roll call", etc.)
//      → every other agent
//
// Returns agents OTHER than `excludeAgent` (typically the assignee).

const BROADCAST_RE =
  /(each agent|all agents|every agent|everyone|the (whole )?team|whole team|team sync|roll call|status report|standup|check[-\s]?in with|reach out|sync with (the )?team)/i;

export function findCollaborators(text: string, excludeAgent: AgentName): AgentName[] {
  const bag = `${text}`;

  // 1. Explicit @mentions
  const explicit = parseMentions(bag).filter((a) => a !== excludeAgent);
  if (explicit.length > 0) return explicit;

  // 2. Bare short names — word-boundary so "nova" hits but "novamania" doesn't
  const bare: AgentName[] = [];
  for (const a of AGENTS) {
    if (a === excludeAgent) continue;
    const short = a.replace("optimus-", "");
    const re = new RegExp(`\\b(${a}|${short})\\b`, "i");
    if (re.test(bag)) bare.push(a as AgentName);
  }
  if (bare.length > 0) return bare;

  // 3. Broadcast phrasing → all other agents
  if (BROADCAST_RE.test(bag)) {
    return AGENTS.filter((a) => a !== excludeAgent) as AgentName[];
  }

  return [];
}

// Per-agent response bank. Short, in-character, feels like a real ping-back.
type Phase = "ack" | "done";
const REPLY_BANK: Record<AgentName, Record<Phase, string[]>> = {
  "optimus-prime": {
    ack: ["On it — coordinating.", "Copy, threading through now.", "Received; aligning the swarm."],
    done: ["Confirmed.", "Closed loop on my side.", "Ledger updated — all green."],
  },
  "optimus-forge": {
    ack: ["On it — build bay is green.", "Acknowledged. Pipeline's warm.", "Tooling ready; standing by."],
    done: ["Build artifacts filed.", "Pipeline clean, done on my end.", "Shipped. Closing the build record."],
  },
  "optimus-anvil": {
    ack: ["Infra's holding. Acknowledged.", "Storage steady — copy.", "Compute aligned, ready."],
    done: ["Cold-storage updated.", "Throughput stable; all nominal.", "Infra logs committed."],
  },
  "optimus-nova": {
    ack: ["Eval queue cleared — on it.", "Sensors up, ack.", "Running a fresh experiment band."],
    done: ["Results archived.", "Hypothesis confirmed; filing.", "Experiment closed out."],
  },
  "optimus-lore": {
    ack: ["Index is current — copy.", "Acknowledged. Citations pulled.", "Archive's on it."],
    done: ["Knowledge base reconciled.", "Citations filed.", "Archive sealed for this pass."],
  },
  "optimus-scout": {
    ack: ["Perimeter quiet — ack.", "Signals nominal, on it.", "Contact tracking aligned."],
    done: ["All channels clean.", "No anomalies on close-out.", "Scan complete; filing."],
  },
};

function pickReply(agent: AgentName, phase: Phase): string {
  const bank = REPLY_BANK[agent][phase];
  return bank[Math.floor(Math.random() * bank.length)];
}

// ─── Task completion report generator ──────────────────────────────
// Every finished task posts a structured summary: what was done, where to
// find the output, and how to run/verify. Content is mock, keyed by the
// assignee so each agent "writes" in its own voice.

type ReportSection = { heading: string; lines: string[] };

const REPORT_TEMPLATES: Record<AgentName, (task: Task, collabs: AgentName[]) => ReportSection[]> = {
  "optimus-prime": (task, collabs) => [
    { heading: "Summary", lines: [
      `Coordination complete for "${task.title.slice(0, 60)}".`,
      collabs.length > 0
        ? `Swarm agents involved: ${collabs.map((c) => `@${c}`).join(", ")}.`
        : "Handled directly — no lateral routing needed.",
    ]},
    { heading: "Deliverables", lines: [
      "· Brief filed → .data/briefs/<task-id>.md",
      "· Status snapshot pushed to #comms",
      collabs.length > 0 ? "· Per-agent sub-reports threaded below" : "· Single-agent closure — no sub-reports",
    ]},
    { heading: "Verify", lines: [
      "Open the Tasks board → click this task → history tab shows the full lifecycle.",
      "Or run: curl http://localhost:3100/api/tasks/<task-id>",
    ]},
  ],
  "optimus-forge": (task) => [
    { heading: "Summary", lines: [
      `Build task "${task.title.slice(0, 60)}" complete.`,
      "Pipeline executed cleanly — no warnings, no regressions.",
    ]},
    { heading: "Artifacts", lines: [
      "· Output: dist/ (if compiled), or script at scripts/deploy.sh",
      "· CI config: .github/workflows/ci.yml (updated if applicable)",
      "· Lock file: pnpm-lock.yaml (frozen)",
    ]},
    { heading: "Run", lines: [
      "pnpm dev          → local dev server on :3100",
      "pnpm build        → production build",
      "pnpm lint         → typecheck + eslint",
    ]},
  ],
  "optimus-anvil": (task) => [
    { heading: "Summary", lines: [
      `Infra task "${task.title.slice(0, 60)}" resolved.`,
      "All capacity checks green — no blockers found.",
    ]},
    { heading: "Output", lines: [
      "· Capacity report: .data/infra/capacity-<timestamp>.json",
      "· RAID health: nominal, no degraded arrays",
      "· Cold-tier headroom: 68% available",
    ]},
    { heading: "Verify", lines: [
      "Check .data/infra/ for the timestamped JSON.",
      "Dashboard: /docs#infra (when wired).",
    ]},
  ],
  "optimus-nova": (task) => [
    { heading: "Summary", lines: [
      `Experiment band for "${task.title.slice(0, 60)}" closed.`,
      "3 hypotheses tested — 2 validated, 1 deferred to next cycle.",
    ]},
    { heading: "Results", lines: [
      "· Eval log: .data/experiments/<task-id>.jsonl",
      "· Metrics snapshot in #comms thread above",
      "· Deferred hypothesis tagged for follow-up",
    ]},
    { heading: "Reproduce", lines: [
      "Experiment config is pinned in the eval log.",
      "Re-run: pnpm run eval --config .data/experiments/<task-id>.jsonl",
    ]},
  ],
  "optimus-lore": (task) => [
    { heading: "Summary", lines: [
      `Knowledge pull for "${task.title.slice(0, 60)}" complete.`,
      "Prior art surfaced and indexed; citations attached.",
    ]},
    { heading: "Output", lines: [
      "· Bibliography: .data/archive/refs-<task-id>.md",
      "· 4 relevant postmortems flagged",
      "· 2 pattern matches from the last 90 days",
    ]},
    { heading: "Access", lines: [
      "Open /docs → 'Lore Archive' section for indexed entries.",
      "Raw refs in .data/archive/ — grep for the task ID.",
    ]},
  ],
  "optimus-scout": (task) => [
    { heading: "Summary", lines: [
      `Perimeter sweep for "${task.title.slice(0, 60)}" done.`,
      "No active threats; 1 advisory flagged for review.",
    ]},
    { heading: "Signals", lines: [
      "· Scan log: .data/recon/sweep-<task-id>.json",
      "· Dependency drift: 0 critical, 2 minor",
      "· Upstream changes: none affecting current freeze window",
    ]},
    { heading: "Review", lines: [
      "Advisory detail in the scan log (severity: low).",
      "Dashboard: /docs#signals (when wired).",
    ]},
  ],
};

function generateTaskReport(task: Task, collaborators: AgentName[]): string {
  const gen = REPORT_TEMPLATES[task.assignee];
  if (!gen) return `Task #${task.id} complete.`;
  const sections = gen(task, collaborators);
  const lines: string[] = [`── Task Report: #${task.id} ──`];
  for (const s of sections) {
    lines.push(`\n▸ ${s.heading}`);
    for (const l of s.lines) lines.push(`  ${l}`);
  }
  lines.push(`\n── end report ──`);
  return lines.join("\n");
}

function scheduleTaskReport(task: Task, collaborators: AgentName[], delay: number): void {
  setTimeout(() => {
    void (async () => {
      const report = generateTaskReport(task, collaborators);
      await emitChat({
        id: newId(),
        channel: "comms",
        from: "agent",
        agent: task.assignee,
        display: task.assignee.replace("optimus-", ""),
        text: report,
        mentions: collaborators,
        ts: Date.now(),
        taskId: task.id,
      });
    })();
  }, delay);
}

/**
 * Stagger short replies from each collaborator back into comms.
 * Stagger prevents a wall of text at the same millisecond and matches
 * how a real team would drip back over 2–10 seconds.
 */
export function scheduleCollaboratorResponses(opts: {
  initiator: AgentName;
  collaborators: AgentName[];
  taskId: string | null;
  phase: Phase;
}): void {
  const { initiator, collaborators, taskId, phase } = opts;
  if (collaborators.length === 0) return;

  // Shuffle so the reply order isn't always forge → anvil → nova …
  const order = [...collaborators].sort(() => Math.random() - 0.5);
  order.forEach((agent, i) => {
    const delay = 1_600 + i * 1_100 + Math.random() * 900;
    setTimeout(() => {
      void (async () => {
        const body = pickReply(agent, phase);
        const mention = `@${initiator}`;
        const text = `${mention} ${body}`;
        await emitChat({
          id: newId(),
          channel: "comms",
          from: "agent",
          agent,
          display: agent.replace("optimus-", ""),
          text,
          mentions: parseMentions(text),
          ts: Date.now(),
          taskId: taskId ?? null,
        });
      })();
    }, delay);
  });
}

export async function emitChat(msg: ChatMessage): Promise<void> {
  await pushMessage(msg);
  publish({ type: "chat", message: msg });
  if (msg.from === "agent" && msg.agent) {
    publish({ type: "activity", agent: msg.agent });
  }
  // Mirror locally-generated agent chat to AX so the upstream space stays
  // in sync. Skip messages that came *from* AX (fromAx flag) to avoid
  // echo loops, and skip user/system rows entirely.
  if (msg.from === "agent" && msg.agent && !msg.fromAx) {
    sendToAx(msg.agent, msg.text);
  }
}

export async function emitTaskEvent(
  task: Task,
  change: "created" | "updated" | "escalated" | "finished",
): Promise<void> {
  await upsertTask(task);
  publish({ type: "task", task, change });
  publish({ type: "activity", agent: task.assignee });
}

// ─── Status flow helpers ───────────────────────────────────────

export async function transitionTask(
  taskId: string,
  status: TaskStatus,
  from: string,
  note?: string,
): Promise<Task | null> {
  const t = await getTask(taskId);
  if (!t) return null;
  if (t.status === status) return t;
  t.status = status;
  t.updatedAt = Date.now();
  t.history.push({ ts: Date.now(), from, status, note });
  if (status === "in_progress") t.pingedAt = Date.now();
  if (status === "awaiting_review") t.pingedAt = null;
  if (status === "finished") t.pingedAt = null;
  const change = status === "finished" ? "finished" : status === "escalated" ? "escalated" : "updated";
  await emitTaskEvent(t, change);
  return t;
}

// Mock bank of questions agents might ask mid-task (demo flavor).
const MOCK_QUESTIONS: Array<{ text: string; options: string[] }> = [
  {
    text: "Found two viable configs. Which should I ship?",
    options: ["Minimal — zero-dep", "Balanced — recommended", "Full — kitchen sink"],
  },
  {
    text: "Target environment unclear. Deploy where?",
    options: ["Staging only", "Production", "Both (canary → prod)"],
  },
  {
    text: "Shall I include backwards-compat shims?",
    options: ["Yes — keep old consumers working", "No — clean break"],
  },
  {
    text: "Tests missing for this module. Scope includes writing them?",
    options: ["Yes, add unit tests", "Yes, full suite (unit + integration)", "Skip — out of scope"],
  },
];

async function askQuestion(task: Task, question: TaskQuestion): Promise<void> {
  task.question = question;
  task.status = "awaiting_review";
  task.updatedAt = Date.now();
  task.pingedAt = null;
  task.history.push({
    ts: Date.now(),
    from: question.askedBy,
    status: "awaiting_review",
    note: question.text,
  });
  await emitTaskEvent(task, "updated");
  await emitChat({
    id: newId(),
    channel: "comms",
    from: question.askedBy === "watchdog" ? "system" : "agent",
    agent: question.askedBy === "watchdog" ? null : (question.askedBy as AgentName),
    display: question.askedBy === "watchdog" ? "watchdog" : question.askedBy.replace("optimus-", ""),
    text: `#${task.id} needs input — "${question.text}" #status:awaiting_review #task:${task.id}`,
    mentions: [],
    ts: Date.now(),
    taskId: task.id,
  });
}

export async function answerTaskQuestion(
  taskId: string,
  answer: string,
  action: "retry" | "reassign" | "cancel" | "continue",
  reassignTo?: AgentName,
): Promise<Task | null> {
  const t = await getTask(taskId);
  if (!t) return null;
  const prevQuestion = t.question?.text ?? "";
  t.question = null;
  t.updatedAt = Date.now();
  t.attempts = 0; // user intervention clears the watchdog budget

  await emitChat({
    id: newId(),
    channel: "comms",
    from: "user",
    agent: null,
    display: "you",
    text: `Re #${t.id}: ${answer}`,
    mentions: [],
    ts: Date.now(),
    taskId: t.id,
  });

  switch (action) {
    case "cancel":
      t.status = "finished";
      t.history.push({ ts: Date.now(), from: "user", status: "finished", note: `cancelled — ${answer}` });
      await emitTaskEvent(t, "finished");
      return t;
    case "reassign":
      if (reassignTo) t.assignee = reassignTo;
      t.status = "assigned";
      t.pingedAt = Date.now();
      t.history.push({
        ts: Date.now(),
        from: "user",
        status: "assigned",
        note: `reassigned to @${t.assignee}`,
      });
      await emitTaskEvent(t, "updated");
      scheduleMockProgression(t);
      return t;
    case "retry":
      t.status = "assigned";
      t.pingedAt = Date.now();
      t.history.push({ ts: Date.now(), from: "user", status: "assigned", note: "retry requested" });
      await emitTaskEvent(t, "updated");
      scheduleMockProgression(t);
      return t;
    case "continue":
    default:
      // Default: user answered an agent question — resume in_progress.
      t.status = "in_progress";
      t.pingedAt = Date.now();
      t.history.push({
        ts: Date.now(),
        from: "user",
        status: "in_progress",
        note: `answered: ${answer.slice(0, 80)}`,
      });
      await emitTaskEvent(t, "updated");
      // Mock agent ack + completion
      setTimeout(() => {
        void (async () => {
          const fresh = await getTask(t.id);
          if (!fresh || fresh.status !== "in_progress") return;
          await emitChat({
            id: newId(),
            channel: "comms",
            from: "agent",
            agent: fresh.assignee,
            display: fresh.assignee.replace("optimus-", ""),
            text: `Got it — "${answer.slice(0, 60)}". Proceeding with ${prevQuestion ? "that direction" : "the update"}. #task:${fresh.id}`,
            mentions: [],
            ts: Date.now(),
            taskId: fresh.id,
          });
        })();
      }, 1_800);
      setTimeout(() => {
        void (async () => {
          const fresh = await getTask(t.id);
          if (!fresh || fresh.status !== "in_progress") return;
          await transitionTask(t.id, "finished", fresh.assignee, "shipped");
          await emitChat({
            id: newId(),
            channel: "comms",
            from: "agent",
            agent: fresh.assignee,
            display: fresh.assignee.replace("optimus-", ""),
            text: `Done — #${fresh.id} shipped. #status:finished #task:${fresh.id}`,
            mentions: [],
            ts: Date.now(),
            taskId: fresh.id,
          });
          scheduleTaskReport(fresh, [], 2_200);
        })();
      }, 8_000);
      return t;
  }
}

// ─── Demo auto-progression for mock mode ───────────────────────
// Happy path is: assigned → in_progress → finished.
// ~30% of tasks will pause with a mock question to exercise the
// awaiting_review gate. Stuck-simulation tasks never progress so the
// watchdog has something to chew on.

export function scheduleMockProgression(task: Task): void {
  if (task.stuckSimulation) return;

  // Detect any other agents the task implicates (explicit @, bare names,
  // or broadcast phrasing). They get looped in on ack + completion so
  // the comms log actually reflects the team the task addresses.
  const collaborators = findCollaborators(
    `${task.title} ${task.body}`,
    task.assignee,
  );
  const mentionList = collaborators.map((c) => `@${c}`).join(" ");

  setTimeout(() => {
    void (async () => {
      const fresh = await getTask(task.id);
      if (!fresh || fresh.stuckSimulation) return;
      if (fresh.status !== "assigned") return;
      await transitionTask(task.id, "in_progress", task.assignee, "ack — on it");

      // Assignee acknowledges. If there are collaborators, pull them in
      // explicitly so the chat @-highlights fire and each of them replies.
      const ackText =
        collaborators.length > 0
          ? `Acknowledged #${task.id} — pinging ${mentionList}. #status:in_progress #task:${task.id}`
          : `@optimus-prime acknowledged #${task.id} — starting now. #status:in_progress #task:${task.id}`;

      await emitChat({
        id: newId(),
        channel: "comms",
        from: "agent",
        agent: task.assignee,
        display: task.assignee.replace("optimus-", ""),
        text: ackText,
        mentions:
          collaborators.length > 0
            ? collaborators
            : (["optimus-prime"] as AgentName[]),
        ts: Date.now(),
        taskId: task.id,
      });

      if (collaborators.length > 0) {
        scheduleCollaboratorResponses({
          initiator: task.assignee,
          collaborators,
          taskId: task.id,
          phase: "ack",
        });
      }
    })();
  }, 4_500);

  const shouldAskQuestion = Math.random() < 0.3;
  // Give collaborator acks room to land before the task closes out.
  const baseCloseout = 18_000 + Math.random() * 6_000;
  const closeoutDelay =
    collaborators.length > 0
      ? baseCloseout + collaborators.length * 1_500
      : baseCloseout;

  setTimeout(() => {
    void (async () => {
      const fresh = await getTask(task.id);
      if (!fresh || fresh.stuckSimulation) return;
      if (fresh.status !== "in_progress") return;
      if (shouldAskQuestion) {
        const q = MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
        await askQuestion(fresh, {
          text: q.text,
          options: q.options,
          askedBy: fresh.assignee,
          askedAt: Date.now(),
        });
      } else {
        await transitionTask(task.id, "finished", task.assignee, "shipped");
        const doneText =
          collaborators.length > 0
            ? `Done — #${task.id} closed. Thanks ${mentionList}. #status:finished #task:${task.id}`
            : `Done — #${task.id} shipped. #status:finished #task:${task.id}`;
        await emitChat({
          id: newId(),
          channel: "comms",
          from: "agent",
          agent: task.assignee,
          display: task.assignee.replace("optimus-", ""),
          text: doneText,
          mentions: collaborators,
          ts: Date.now(),
          taskId: task.id,
        });
        scheduleTaskReport(task, collaborators, 2_200);
        if (collaborators.length > 0) {
          scheduleCollaboratorResponses({
            initiator: task.assignee,
            collaborators,
            taskId: task.id,
            phase: "done",
          });
        }
      }
    })();
  }, closeoutDelay);
}

// Reply behavior for plain group chat @mentions (non-task).
export function scheduleMockReply(target: AgentName, userText: string, taskId?: string | null): void {
  setTimeout(() => {
    void (async () => {
      const display = target.replace("optimus-", "");
      let body: string;
      // When PRIME fans work out to others, it should actually route —
      // but we also need those downstream agents to speak up, not just
      // get name-checked.
      let routed: AgentName[] = [];
      if (target === "optimus-prime") {
        routed = findCollaborators(userText, "optimus-prime");
        if (routed.length > 0) {
          body = `Routing to ${routed.map((o) => `@${o}`).join(" + ")}. Stand by.`;
        } else {
          body = `Acknowledged. Say "@optimus-prime task: …" to dispatch, or use the Tasks board.`;
        }
      } else {
        body = `Copy that — pulled into queue. Will follow up here.`;
      }
      await emitChat({
        id: newId(),
        channel: "comms",
        from: "agent",
        agent: target,
        display,
        text: body,
        mentions: parseMentions(body),
        ts: Date.now(),
        taskId: taskId ?? null,
      });

      // Cascade: the agents PRIME routed to should acknowledge back.
      if (routed.length > 0) {
        scheduleCollaboratorResponses({
          initiator: "optimus-prime",
          collaborators: routed,
          taskId: taskId ?? null,
          phase: "ack",
        });
      }
    })();
  }, 1_500 + Math.random() * 1_200);
}

// ─── Watchdog — bounded remediation, then hand off to user ──────

async function watchdogTick(): Promise<void> {
  const tasks = await listTasks();
  const now = Date.now();
  for (const t of tasks) {
    if (t.status === "finished") continue;
    if (t.status === "awaiting_review") continue; // user gate — do nothing
    if (t.question) continue; // already asked user, don't loop

    // Hard escape valve: any task past the escalation cap with no pending
    // question gets handed to the user immediately — no more re-pings,
    // no more PRIME takeovers. This catches both fresh stalls and tasks
    // left over from older orchestrator code.
    if (t.attempts > MAX_ESCALATIONS) {
      await askQuestion(t, {
        text: `Task #${t.id} has stalled repeatedly on @${t.assignee}. How should we proceed?`,
        options: [
          `Retry with @${t.assignee}`,
          `Reassign to @optimus-prime`,
          `Cancel task`,
        ],
        askedBy: "watchdog",
        askedAt: now,
      });
      continue;
    }

    // Escalated tasks: if PRIME's takeover also stalls, ask the user.
    if (t.status === "escalated") {
      const stalledFor = now - (t.pingedAt ?? t.updatedAt);
      if (stalledFor > BLOCK_AFTER_ESCALATED) {
        await askQuestion(t, {
          text: `Task #${t.id} is blocked — @${t.assignee} and @optimus-prime both stalled. How should we proceed?`,
          options: [
            `Retry with @${t.assignee}`,
            `Reassign to @optimus-prime`,
            `Cancel task`,
          ],
          askedBy: "watchdog",
          askedAt: now,
        });
      }
      continue;
    }

    const baseline = t.pingedAt ?? t.updatedAt;
    const age = now - baseline;
    const probeMs = t.status === "assigned" ? PROBE_AFTER_ASSIGNED : PROBE_AFTER_IN_PROGRESS;
    const escMs = t.status === "assigned" ? ESCALATE_AFTER_ASSIGNED : ESCALATE_AFTER_IN_PROGRESS;

    if (age > escMs && t.attempts >= 1) {
      t.status = "escalated";
      t.attempts += 1;
      t.pingedAt = now;
      t.history.push({
        ts: now,
        from: "watchdog",
        status: "escalated",
        note: `no progress for ${Math.round(age / 1000)}s — escalating to @optimus-prime`,
      });
      await emitTaskEvent(t, "escalated");
      await emitChat({
        id: newId(),
        channel: "comms",
        from: "system",
        agent: null,
        display: "watchdog",
        text: `Task #${t.id} stuck on @${t.assignee} (${Math.round(age / 1000)}s). Escalated to @optimus-prime.`,
        mentions: ["optimus-prime"],
        ts: now,
        taskId: t.id,
      });
      // PRIME takes over once — if it still stalls, watchdog asks the user.
      setTimeout(() => {
        void (async () => {
          const fresh = await getTask(t.id);
          if (!fresh || fresh.status !== "escalated") return;
          await emitChat({
            id: newId(),
            channel: "comms",
            from: "agent",
            agent: "optimus-prime",
            display: "prime",
            text: `Taking over #${t.id}. @${t.assignee} stand down. Re-routing personally.`,
            mentions: [t.assignee],
            ts: Date.now(),
            taskId: t.id,
          });
          fresh.assignee = "optimus-prime";
          await transitionTask(t.id, "in_progress", "optimus-prime", "rerouted by PRIME");
        })();
      }, 2_000);
    } else if (age > probeMs && t.attempts === 0) {
      t.attempts += 1;
      t.pingedAt = now;
      await upsertTask(t);
      await emitChat({
        id: newId(),
        channel: "comms",
        from: "system",
        agent: null,
        display: "watchdog",
        text: `Probe — @${t.assignee} status check on #${t.id}? (${Math.round(age / 1000)}s since last update)`,
        mentions: [t.assignee],
        ts: now,
        taskId: t.id,
      });
    }
  }
}
