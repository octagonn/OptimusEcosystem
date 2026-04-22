/**
 * GatewayEventSource — adapter seam between the facility UI and whatever is
 * currently producing per-agent activity events.
 *
 * Today: events come from `ax listen --json` subprocesses (one per agent),
 * parsed defensively in `axBridge.ts`. This is a pre-aX-Gateway stopgap.
 *
 * Target (see PLAN.md §5.5): events come from the local aX Gateway daemon
 * over mTLS SSE, carrying the typed 11-method protocol. When that lands, the
 * SubprocessEventSource implementation below is swapped for a
 * GatewaySSEEventSource — no other file in the app needs to change.
 *
 * This file intentionally contains NO implementation yet. It defines the
 * contract so both implementations can coexist during the swap-over window.
 */
import type { AgentName } from "@optimus/shared";
import type { AgentState } from "@optimus/shared";

/**
 * Typed superset of what both the current subprocess bridge AND the future
 * gateway protocol can emit. Kinds marked `gateway-only` are no-ops in
 * subprocess mode (the CLI doesn't produce them).
 */
export type GatewayEvent =
  | {
      kind: "message_in" | "message_out";
      agent: AgentName;
      from?: AgentName | "user" | "ax";
      to?: AgentName;
      content: string;
      replyTo?: string;
      messageId?: string;
      ts: number;
    }
  | {
      kind: "state";
      agent: AgentName;
      state: AgentState;
      ts: number;
    }
  // gateway-only kinds (phases 3–4 of aX Gateway roadmap):
  | {
      kind: "heartbeat";
      agent: AgentName;
      ts: number;
    }
  | {
      kind: "ack_work" | "start_work" | "complete_work" | "fail_work";
      agent: AgentName;
      workId: string;
      leaseMs?: number;
      elapsedMs?: number;
      reason?: string;
      ts: number;
    }
  | {
      kind: "progress";
      agent: AgentName;
      workId: string;
      percent?: number;
      note?: string;
      ts: number;
    }
  | {
      kind: "tool_denied" | "tool_granted";
      agent: AgentName;
      tool: string;
      policy?: string;
      ts: number;
    };

export interface GatewayEventSource {
  /** Human-readable label for the `/api/ax/status` probe. */
  readonly kind: "subprocess" | "gateway-sse";

  /** Start consuming. Resolves once the source is healthy (or degraded). */
  start(): Promise<void>;

  /** Stop cleanly. Safe to call multiple times. */
  stop(): void;

  /** Register an event handler. Multiple handlers allowed. */
  onEvent(handler: (evt: GatewayEvent) => void): () => void;

  /** Outbound: send a message as an agent (still works post-gateway). */
  send(agent: AgentName, text: string): Promise<void>;

  /** Status probe for the `/api/ax/status` route. */
  getStatus(): {
    kind: "subprocess" | "gateway-sse";
    ok: boolean;
    detail: string;
    agents: Array<{ agent: AgentName; running: boolean; lastError: string | null }>;
  };
}

/**
 * Factory — selects which implementation to use based on env.
 * Not wired yet. When the gateway client exists, this becomes:
 *
 *   if (process.env.AX_GATEWAY_URL) return new GatewaySSEEventSource(...)
 *   return new SubprocessEventSource(...)
 *
 * For now `axBridge.ts` is the only producer; this factory is a TODO marker.
 */
export function selectGatewayEventSource(): GatewayEventSource | null {
  // TODO(gateway-phase-3): return new GatewaySSEEventSource() when AX_GATEWAY_URL is set.
  // TODO(gateway-phase-3): otherwise wrap axBridge.ts behind SubprocessEventSource.
  return null;
}
