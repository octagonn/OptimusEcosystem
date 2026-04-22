import type { AgentName } from "./agents";

// Renderable agent states. The first four are the legacy Phase 1 contract
// (idle | listening | processing | replied). The rest are gateway-lifecycle
// states the facility needs to visualize once aX Gateway lands
// (see PLAN.md §5.5). Internal gateway states like Registered/Starting are
// intentionally omitted — they have no UI representation.
export type AgentState =
  | "idle"
  | "listening"
  | "processing"
  | "replied"
  | "blocked"
  | "degraded"
  | "reconnecting"
  | "failed";

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
