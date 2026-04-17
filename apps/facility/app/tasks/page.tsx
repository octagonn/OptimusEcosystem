"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, AlertTriangle, RefreshCw, HelpCircle, CheckCircle2, Send } from "lucide-react";
import LeftRail from "@/app/components/LeftRail";
import GroupComms from "@/app/components/GroupComms";
import { useGroupChat } from "@/app/state/groupChatStore";
import { AGENT_PROFILES } from "@/app/lib/agentProfiles";
import { AGENTS, type AgentName } from "@optimus/shared";
import type { Project, Task, TaskStatus } from "@/app/lib/types";
import { TASK_COLUMNS } from "@/app/lib/types";

const COLUMN_LABEL: Record<TaskStatus, string> = {
  assigned: "assigned",
  in_progress: "in progress",
  awaiting_review: "needs input",
  finished: "finished",
  escalated: "escalated",
};

const COLUMN_HINT: Record<TaskStatus, string> = {
  assigned: "dispatched — awaiting pickup",
  in_progress: "agent working",
  awaiting_review: "agent needs your answer",
  finished: "shipped",
  escalated: "stalled — prime taking over",
};

export default function TasksPage() {
  const tasks = useGroupChat((s) => s.tasks);
  const setTasks = useGroupChat((s) => s.setTasks);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? []));
    void fetch("/api/tasks").then((r) => r.json()).then((d) => setTasks(d.tasks ?? []));
  }, [setTasks]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "unassigned") return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === filter);
  }, [tasks, filter]);

  const escalated = filtered.filter((t) => t.status === "escalated");
  const cols: Record<TaskStatus, Task[]> = {
    assigned: [],
    in_progress: [],
    awaiting_review: [],
    finished: [],
    escalated: [],
  };
  for (const t of filtered) cols[t.status].push(t);

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020304] select-none flex">
      <LeftRail />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center px-6 h-14 border-b border-[#1A2233] shrink-0">
          <h1 className="text-[12px] font-mono text-[#D8DEE9] tracking-[0.18em] uppercase">
            Tasks
            <span className="text-[#C1121F] mx-2">//</span>
            <span className="text-[#5D6B82]">orchestrator board</span>
          </h1>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-4 bg-[#0B1220] border border-[#1A2233] text-[10px] font-mono text-[#8A94A8] uppercase tracking-wider px-2 h-7 rounded outline-none focus:border-[#C1121F]/60"
          >
            <option value="all">all projects</option>
            <option value="unassigned">no project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {escalated.length > 0 && (
            <span className="ml-3 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#C1121F]">
              <AlertTriangle size={12} className="animate-pulse" />
              {escalated.length} escalated
            </span>
          )}

          <button
            onClick={() => setCreating(true)}
            type="button"
            className="ml-auto flex items-center gap-1.5 px-3 h-7 rounded bg-[#C1121F]/15 border border-[#C1121F]/40 text-[10px] font-mono uppercase tracking-wider text-[#C1121F] hover:bg-[#C1121F]/25 transition-colors"
          >
            <Plus size={12} />
            new task
          </button>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-3 px-4 py-4">
          {TASK_COLUMNS.map((col) => (
            <Column
              key={col}
              status={col}
              label={COLUMN_LABEL[col]}
              hint={COLUMN_HINT[col]}
              tasks={cols[col]}
              projects={projects}
              onOpen={setOpenTaskId}
            />
          ))}
          {cols.escalated.length > 0 && (
            <Column
              status="escalated"
              label={COLUMN_LABEL.escalated}
              hint={COLUMN_HINT.escalated}
              tasks={cols.escalated}
              projects={projects}
              onOpen={setOpenTaskId}
              warning
            />
          )}
        </div>
      </div>

      {creating && (
        <NewTaskModal
          projects={projects}
          onClose={() => setCreating(false)}
          onCreated={(t) => {
            useGroupChat.getState().upsertTask(t);
            setCreating(false);
          }}
        />
      )}

      {openTask && (
        <TaskDetailModal
          task={openTask}
          project={projects.find((p) => p.id === openTask.projectId) ?? null}
          onClose={() => setOpenTaskId(null)}
        />
      )}

      <GroupComms />
    </main>
  );
}

function Column({
  status,
  label,
  hint,
  tasks,
  projects,
  onOpen,
  warning,
}: {
  status: TaskStatus;
  label: string;
  hint: string;
  tasks: Task[];
  projects: Project[];
  onOpen: (id: string) => void;
  warning?: boolean;
}) {
  const accent = warning
    ? "#C1121F"
    : status === "finished"
      ? "#059669"
      : status === "awaiting_review"
        ? "#D4880F"
        : "#5D6B82";
  return (
    <div className="w-[300px] shrink-0 flex flex-col bg-[#06090F] border border-[#1A2233] rounded-md overflow-hidden">
      <div
        className="flex flex-col px-3 py-2 border-b border-[#1A2233]"
        style={{ color: accent }}
      >
        <div className="flex items-center text-[10px] font-mono uppercase tracking-wider">
          <span>{label}</span>
          <span className="ml-2 text-[#3A4A60]">· {tasks.length}</span>
        </div>
        <div className="text-[9px] font-mono text-[#3A4A60] mt-0.5 normal-case tracking-normal">
          {hint}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.length === 0 && (
          <div className="text-[10px] font-mono text-[#3A4A60] uppercase tracking-wider text-center py-4">
            empty
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} projects={projects} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  projects,
  onOpen,
}: {
  task: Task;
  projects: Project[];
  onOpen: (id: string) => void;
}) {
  const p = AGENT_PROFILES[task.assignee];
  const project = projects.find((x) => x.id === task.projectId);
  const stale = task.status !== "finished" && task.status !== "awaiting_review"
    && Date.now() - task.updatedAt > 30_000;

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="block w-full text-left rounded p-2 bg-[#0B1220] border text-[11px] font-mono text-[#D8DEE9] hover:bg-[#111A2A] transition-colors"
      style={{
        borderColor: task.status === "escalated"
          ? "#C1121F66"
          : task.status === "awaiting_review"
            ? "#D4880F80"
            : `${p.accentHex}30`,
        boxShadow: task.status === "escalated"
          ? "0 0 16px -6px #C1121F"
          : task.status === "awaiting_review"
            ? "0 0 14px -8px #D4880F"
            : "none",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] uppercase tracking-wider" style={{ color: p.accentHex }}>
          @{p.handle.replace("optimus-", "")}
        </span>
        <span className="text-[9px] text-[#3A4A60]">#{task.id.split("-").pop()}</span>
        {project && (
          <span
            className="ml-auto text-[8px] uppercase tracking-wider px-1 rounded-sm"
            style={{ color: project.color, backgroundColor: `${project.color}1f` }}
          >
            {project.name}
          </span>
        )}
      </div>
      <div className="text-[11px] text-[#D8DEE9] leading-snug">{task.title}</div>
      {task.question && (
        <div className="mt-1.5 flex items-start gap-1 text-[10px] text-[#D4880F] leading-snug">
          <HelpCircle size={11} className="mt-0.5 shrink-0" />
          <span className="italic line-clamp-2">{task.question.text}</span>
        </div>
      )}
      {!task.question && task.body && (
        <div className="text-[10px] text-[#5D6B82] leading-snug mt-1 line-clamp-2">
          {task.body}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[#1A2233]">
        <span className="text-[9px] text-[#3A4A60]">
          {new Date(task.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        {task.stuckSimulation && (
          <span className="text-[9px] text-[#D4880F] flex items-center gap-1">
            <AlertTriangle size={10} /> stuck-sim
          </span>
        )}
        {stale && task.status !== "escalated" && (
          <span className="text-[9px] text-[#C1121F] flex items-center gap-1">
            <RefreshCw size={10} /> watchdog
          </span>
        )}
        {task.status === "finished" && (
          <span className="ml-auto text-[9px] text-[#059669] flex items-center gap-1">
            <CheckCircle2 size={10} /> shipped
          </span>
        )}
      </div>
    </button>
  );
}

function TaskDetailModal({
  task,
  project,
  onClose,
}: {
  task: Task;
  project: Project | null;
  onClose: () => void;
}) {
  const p = AGENT_PROFILES[task.assignee];
  const [customAnswer, setCustomAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitAnswer = async (answer: string) => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const action = deriveAction(answer);
      const reassignTo = action === "reassign" ? "optimus-prime" : undefined;
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, answer, action, reassignTo }),
      });
      if (res.ok) {
        const d = await res.json();
        useGroupChat.getState().upsertTask(d.task);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-[560px] max-w-[94vw] max-h-[86vh] overflow-hidden rounded-lg border border-[#1A2233] bg-[#070A11] flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-[#1A2233]"
          style={{
            background: `linear-gradient(180deg, ${p.accentHex}14 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center border shrink-0"
              style={{
                borderColor: p.accentHex,
                backgroundColor: `${p.accentHex}1f`,
                color: p.accentHex,
              }}
            >
              <span className="text-[11px] font-bold tracking-tighter">{p.name.slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                <span style={{ color: p.accentHex }}>@{p.handle.replace("optimus-", "")}</span>
                <span className="text-[#3A4A60]">·</span>
                <span className="text-[#8A94A8]">{task.status.replace("_", " ")}</span>
                {project && (
                  <>
                    <span className="text-[#3A4A60]">·</span>
                    <span style={{ color: project.color }}>{project.name}</span>
                  </>
                )}
              </div>
              <h2 className="text-[14px] text-[#D8DEE9] mt-1 leading-snug">{task.title}</h2>
              <div className="text-[9px] text-[#3A4A60] mt-1">#{task.id}</div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="text-[#5D6B82] hover:text-[#D8DEE9] shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {task.body && (
            <section>
              <div className="text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">brief</div>
              <p className="text-[11px] text-[#8A94A8] leading-relaxed whitespace-pre-wrap">
                {task.body}
              </p>
            </section>
          )}

          {task.question && (
            <section
              className="rounded-md border p-3"
              style={{ borderColor: "#D4880F60", backgroundColor: "#D4880F0c" }}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#D4880F] mb-2">
                <HelpCircle size={12} />
                {task.question.askedBy === "watchdog" ? "watchdog" : `@${task.question.askedBy.replace("optimus-", "")}`} needs your input
              </div>
              <p className="text-[12px] text-[#D8DEE9] leading-relaxed mb-3">
                {task.question.text}
              </p>
              <div className="space-y-1.5">
                {task.question.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitAnswer(opt)}
                    className="w-full text-left px-3 py-2 rounded border border-[#1A2233] bg-[#0B1220] hover:border-[#D4880F]/60 hover:bg-[#D4880F]/08 text-[11px] text-[#D8DEE9] transition-colors disabled:opacity-40"
                  >
                    <span className="text-[9px] text-[#5D6B82] mr-2">{i + 1}.</span>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1A2233]">
                <div className="text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">
                  or type your own answer
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customAnswer.trim()) void submitAnswer(customAnswer);
                    }}
                    placeholder="free-form answer…"
                    disabled={submitting}
                    className="flex-1 bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[11px] text-[#D8DEE9] outline-none focus:border-[#D4880F]/60 disabled:opacity-40"
                  />
                  <button
                    onClick={() => void submitAnswer(customAnswer)}
                    disabled={!customAnswer.trim() || submitting}
                    type="button"
                    className="px-2 h-8 rounded bg-[#D4880F]/20 border border-[#D4880F]/50 text-[#D4880F] hover:bg-[#D4880F]/30 disabled:opacity-30"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">
              history · {task.history.length}
            </div>
            <ul className="space-y-1.5">
              {task.history.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[10px] text-[#8A94A8] border-l border-[#1A2233] pl-2"
                >
                  <span className="text-[#3A4A60] shrink-0 w-16">
                    {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="text-[#5D6B82] shrink-0 w-20">{h.from}</span>
                  <span className="shrink-0 w-24" style={{ color: "#8A94A8" }}>
                    → {h.status.replace("_", " ")}
                  </span>
                  {h.note && <span className="text-[#5D6B82] flex-1">{h.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function deriveAction(answer: string): "retry" | "reassign" | "cancel" | "continue" {
  const a = answer.toLowerCase();
  if (a.startsWith("cancel") || a.includes("cancel task")) return "cancel";
  if (a.includes("reassign") || a.includes("@optimus-prime")) return "reassign";
  if (a.startsWith("retry") || a.includes("retry with")) return "retry";
  return "continue";
}

function NewTaskModal({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[];
  onClose: () => void;
  onCreated: (t: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [assignee, setAssignee] = useState<AgentName>("optimus-forge");
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [stuck, setStuck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        assignee,
        projectId: projectId || null,
        stuckSimulation: stuck,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      onCreated(d.task);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-[480px] max-w-[92vw] rounded-lg border border-[#1A2233] bg-[#070A11] p-5 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-[#C1121F]">new task</h2>
          <button onClick={onClose} type="button" className="ml-auto text-[#5D6B82] hover:text-[#D8DEE9]">
            <X size={14} />
          </button>
        </div>

        <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="what should the agent do?"
          className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[12px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60"
        />

        <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mt-3 mb-1">brief (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="context, links, acceptance criteria…"
          className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[11px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60 resize-none"
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value as AgentName)}
              className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[11px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60"
            >
              {AGENTS.map((a) => (
                <option key={a} value={a}>
                  @{a.replace("optimus-", "")} — {AGENT_PROFILES[a].role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[11px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60"
            >
              <option value="">— none —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 text-[10px] uppercase tracking-wider text-[#8A94A8] cursor-pointer">
          <input
            type="checkbox"
            checked={stuck}
            onChange={(e) => setStuck(e.target.checked)}
            className="accent-[#D4880F]"
          />
          simulate stuck agent (watchdog demo)
        </label>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            type="button"
            className="px-3 h-8 rounded text-[10px] uppercase tracking-wider text-[#5D6B82] hover:text-[#D8DEE9]"
          >
            cancel
          </button>
          <button
            onClick={() => void create()}
            disabled={!title.trim() || submitting}
            type="button"
            className="px-4 h-8 rounded text-[10px] uppercase tracking-wider bg-[#C1121F]/20 border border-[#C1121F]/50 text-[#C1121F] hover:bg-[#C1121F]/30 disabled:opacity-30"
          >
            dispatch
          </button>
        </div>
      </div>
    </div>
  );
}
