import type { AgentName } from "./agents";

export type AgentState = "idle" | "listening" | "processing" | "replied";

export interface ActivityEvent {
  ts: number;
  agent: AgentName;
  kind: "dispatch_start" | "dispatch_end" | "message_out" | "message_in" | "mention" | "state";
  state?: AgentState;
  from?: AgentName;
  to?: AgentName;
  reply_to?: string;
  message_id?: string;
  preview?: string;
}
