/**
 * Placeholder store for aX Gateway SLA metrics.
 *
 * These values mirror the fleet-dashboard metrics row from the aX Gateway
 * vision deck (slide 5). Today they are all stubbed at zero / "pending"
 * because the facility has no producer for them yet — we shell out to
 * `ax listen` per agent (see ./axBridge.ts) which does not emit SLA
 * telemetry.
 *
 * When aX Gateway phase 3 ships, the SSE event source in
 * ./gatewayEventSource.ts will carry heartbeat + queue + lease events,
 * and this store becomes the sink for them. UI surfaces (HUD chips,
 * sidebar, swarm-board overlay) read from this store without caring
 * which producer is live.
 *
 * See PLAN.md §5.5 for the full target-state write-up.
 */
import { create } from "zustand";

export interface GatewayMetrics {
  /** How many agents the gateway reports as Connected+Online. */
  agentsOnline: number;
  /** Total agents registered with the gateway (denominator for online). */
  agentsTotal: number;
  /** Oldest un-ACKed work item age, in ms. */
  oldestWorkAgeMs: number;
  /** Current work-queue depth across all agents. */
  queueDepth: number;
  /** p95 handle time over the last window, in ms. */
  p95HandleTimeMs: number;
  /** Percentage of work items ACKed within the 5s SLA window (0–1). */
  workAckRate: number;
  /** Tool-call denials in the last window (from Policy Gate). */
  toolDeniedCount: number;
  /**
   * Liveness of the metrics pipeline itself. "pending" = no producer
   * attached (current state); "subprocess" = mock values from the
   * `ax listen` bridge; "gateway" = live values from the SSE client.
   */
  source: "pending" | "subprocess" | "gateway";
  /** Epoch ms of last update. 0 = never. */
  lastUpdate: number;
}

interface GatewayMetricsStore extends GatewayMetrics {
  update: (partial: Partial<GatewayMetrics>) => void;
  reset: () => void;
}

const INITIAL: GatewayMetrics = {
  agentsOnline: 0,
  agentsTotal: 6,
  oldestWorkAgeMs: 0,
  queueDepth: 0,
  p95HandleTimeMs: 0,
  workAckRate: 0,
  toolDeniedCount: 0,
  source: "pending",
  lastUpdate: 0,
};

export const useGatewayMetrics = create<GatewayMetricsStore>((set) => ({
  ...INITIAL,
  update: (partial) =>
    set((s) => ({ ...s, ...partial, lastUpdate: Date.now() })),
  reset: () => set({ ...INITIAL }),
}));
