import type { AgentName } from "@optimus/shared";

export type TaskStatus =
  | "assigned"
  | "in_progress"
  | "awaiting_review"
  | "finished"
  | "escalated";

export const TASK_COLUMNS: TaskStatus[] = [
  "assigned",
  "in_progress",
  "awaiting_review",
  "finished",
];

export interface TaskQuestion {
  text: string;
  options: string[];
  askedBy: AgentName | "watchdog";
  askedAt: number;
}

export interface Task {
  id: string;
  title: string;
  body: string;
  projectId: string | null;
  assignee: AgentName;
  createdBy: "user" | AgentName;
  status: TaskStatus;
  stuckSimulation: boolean;
  createdAt: number;
  updatedAt: number;
  history: TaskHistoryEntry[];
  pingedAt: number | null;
  attempts: number;
  question: TaskQuestion | null;
}

export interface TaskHistoryEntry {
  ts: number;
  from: string;
  status: TaskStatus;
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
}

export type MessageFrom = "user" | "agent" | "system";

export interface ChatMessage {
  id: string;
  channel: "comms";
  from: MessageFrom;
  agent: AgentName | null;
  display: string;
  text: string;
  mentions: AgentName[];
  ts: number;
  taskId?: string | null;
  /** True when the message originated on the AX platform — prevents echo-back. */
  fromAx?: boolean;
}

export type BusEvent =
  | { type: "chat"; message: ChatMessage }
  | {
      type: "task";
      task: Task;
      change: "created" | "updated" | "escalated" | "finished";
    }
  | { type: "activity"; agent: AgentName; intensity?: number }
  | { type: "info"; message: string };
