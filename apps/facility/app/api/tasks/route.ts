import { NextResponse } from "next/server";
import { AGENTS, type AgentName } from "@optimus/shared";
import { listProjects, listTasks } from "@/app/lib/store";
import {
  answerTaskQuestion,
  emitChat,
  emitTaskEvent,
  ensureOrchestrator,
  scheduleMockProgression,
  transitionTask,
} from "@/app/lib/orchestrator";
import type { Task, TaskStatus } from "@/app/lib/types";

const VALID_STATUS: TaskStatus[] = [
  "assigned",
  "in_progress",
  "awaiting_review",
  "finished",
  "escalated",
];

const newId = () => `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

export async function GET() {
  ensureOrchestrator();
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  ensureOrchestrator();
  const payload = await request.json();
  const title = String(payload?.title ?? "").trim();
  const body = String(payload?.body ?? "").trim();
  const assignee = String(payload?.assignee ?? "");
  const projectId = payload?.projectId ? String(payload.projectId) : null;
  const stuckSimulation = Boolean(payload?.stuckSimulation);

  if (!title || !AGENTS.includes(assignee as AgentName)) {
    return NextResponse.json({ error: "title + valid assignee required" }, { status: 400 });
  }
  if (projectId) {
    const projects = await listProjects();
    if (!projects.find((p) => p.id === projectId)) {
      return NextResponse.json({ error: "unknown projectId" }, { status: 400 });
    }
  }

  const now = Date.now();
  const task: Task = {
    id: newId(),
    title,
    body,
    projectId,
    assignee: assignee as AgentName,
    createdBy: "user",
    status: "assigned",
    stuckSimulation,
    createdAt: now,
    updatedAt: now,
    history: [{ ts: now, from: "user", status: "assigned", note: "task created" }],
    pingedAt: now,
    attempts: 0,
    question: null,
  };
  await emitTaskEvent(task, "created");

  // PRIME announces dispatch in the comms log
  await emitChat({
    id: `M-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    channel: "comms",
    from: "agent",
    agent: "optimus-prime",
    display: "prime",
    text: `Dispatching #${task.id} to @${task.assignee}: ${task.title}${
      task.stuckSimulation ? " (⚠ stuck-simulation: agent will not auto-respond)" : ""
    }`,
    mentions: [task.assignee],
    ts: Date.now(),
    taskId: task.id,
  });

  scheduleMockProgression(task);
  return NextResponse.json({ task });
}

export async function PATCH(request: Request) {
  ensureOrchestrator();
  const payload = await request.json();
  const id = String(payload?.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Answer a question the agent (or watchdog) posed
  if (payload?.answer) {
    const answer = String(payload.answer);
    const action = (payload.action as "retry" | "reassign" | "cancel" | "continue") ?? "continue";
    const reassignTo = payload.reassignTo && AGENTS.includes(payload.reassignTo as AgentName)
      ? (payload.reassignTo as AgentName)
      : undefined;
    const task = await answerTaskQuestion(id, answer, action, reassignTo);
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ task });
  }

  const status = payload?.status as TaskStatus;
  const note = payload?.note ? String(payload.note) : undefined;
  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "valid status required" }, { status: 400 });
  }
  const task = await transitionTask(id, status, "user", note);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task });
}
