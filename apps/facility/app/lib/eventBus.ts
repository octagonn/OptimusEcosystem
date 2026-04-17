import type { BusEvent } from "./types";

type Listener = (e: BusEvent) => void;

const g = globalThis as unknown as { __optimusBus?: Set<Listener> };
const listeners: Set<Listener> = g.__optimusBus ?? new Set();
g.__optimusBus = listeners;

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function publish(event: BusEvent): void {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch {
      /* swallow */
    }
  }
}
