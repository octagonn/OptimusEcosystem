export interface Waypoint {
  x: number;
  y: number;
}

export interface NavigatorState {
  x: number;
  y: number;
  walking: boolean;
  facing: -1 | 1;
  update: (dtSec: number) => void;
}

interface NavigatorOpts {
  waypoints: Waypoint[];
  startIndex?: number;
  /** World units per second while walking. Typical 18–32. */
  speed?: number;
  /** Seconds to idle after arriving at a waypoint. */
  pauseMin?: number;
  pauseMax?: number;
  /** Random tie-breaker so agents don't sync up. */
  seed?: number;
}

/**
 * Per-agent waypoint follower. Keeps the agent inside its own room,
 * rotates through a hand-picked set of interior stops, and pauses for
 * a human-feeling beat on arrival. Speed is a rate — the path takes
 * however long the geometry says it takes (walking, not teleporting).
 */
export function createNavigator(opts: NavigatorOpts): NavigatorState {
  if (opts.waypoints.length < 2) {
    throw new Error("Navigator needs at least two waypoints");
  }

  const speed = opts.speed ?? 24;
  const pauseMin = opts.pauseMin ?? 1.4;
  const pauseMax = opts.pauseMax ?? 3.4;

  // Simple seeded RNG so each agent's cadence differs but stays deterministic
  // across reloads for easier QA.
  let rngSeed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const rand = () => {
    rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0;
    return rngSeed / 0xffffffff;
  };

  const startIdx = opts.startIndex ?? Math.floor(rand() * opts.waypoints.length);
  let targetIdx = pickNext(startIdx);

  function pickNext(prev: number): number {
    if (opts.waypoints.length < 2) return prev;
    let i = prev;
    // No repeats and no immediate backtrack
    while (i === prev) i = Math.floor(rand() * opts.waypoints.length);
    return i;
  }

  const start = opts.waypoints[startIdx];
  const state: NavigatorState = {
    x: start.x,
    y: start.y,
    walking: false,
    facing: 1,
    update: () => {},
  };

  // Start paused before the first step so agents don't all lurch on frame 0
  let pauseLeft = pauseMin + rand() * (pauseMax - pauseMin);

  state.update = (dtSec: number) => {
    // Clamp dt — first frame after tab refocus can be huge and cause a teleport
    const dt = Math.max(0, Math.min(dtSec, 0.1));

    if (pauseLeft > 0) {
      pauseLeft -= dt;
      state.walking = false;
      return;
    }

    const target = opts.waypoints[targetIdx];
    const dx = target.x - state.x;
    const dy = target.y - state.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.5) {
      // Arrived. Snap, pause, pick next.
      state.x = target.x;
      state.y = target.y;
      state.walking = false;
      pauseLeft = pauseMin + rand() * (pauseMax - pauseMin);
      targetIdx = pickNext(targetIdx);
      return;
    }

    const step = Math.min(dist, speed * dt);
    state.x += (dx / dist) * step;
    state.y += (dy / dist) * step;
    state.walking = true;
    // Only update facing when there's meaningful lateral motion, so a
    // purely vertical leg doesn't snap the sprite back and forth.
    if (Math.abs(dx) > 0.25) {
      state.facing = dx < 0 ? -1 : 1;
    }
  };

  return state;
}

/**
 * Picks a natural spread of interior waypoints for a rectangular room.
 * Avoids walls (WALL band), doors at the mid-edges, and the central
 * cross seam area. Hand-tuned to feel like "stations an agent would
 * actually visit" — a front pace line, a back workspace, two flanks.
 */
export function roomWaypoints(
  roomW: number,
  roomH: number,
  wallThickness: number,
  seed: number,
): Waypoint[] {
  const wall = wallThickness;
  const margin = 34; // clear of walls + sprite half-width
  const minX = wall + margin;
  const maxX = roomW - wall - margin;
  const minY = wall + margin;
  const maxY = roomH - wall - margin;

  // A small per-agent jitter so six identical grids don't walk in unison
  const jx = ((seed * 9301 + 49297) % 233280) / 233280; // 0..1
  const jy = ((seed * 733 + 12345) % 65521) / 65521;
  const jitter = (v: number, amount = 18) => v + (jx - 0.5) * amount + (jy - 0.5) * amount * 0.4;

  return [
    // Back-left workstation
    { x: jitter(minX + (maxX - minX) * 0.22), y: jitter(minY + (maxY - minY) * 0.28) },
    // Back-right workstation
    { x: jitter(minX + (maxX - minX) * 0.78), y: jitter(minY + (maxY - minY) * 0.28) },
    // Front-center (where the agent used to stand)
    { x: jitter(minX + (maxX - minX) * 0.5),  y: jitter(minY + (maxY - minY) * 0.82, 10) },
    // Front-left flank
    { x: jitter(minX + (maxX - minX) * 0.22), y: jitter(minY + (maxY - minY) * 0.72) },
    // Front-right flank
    { x: jitter(minX + (maxX - minX) * 0.78), y: jitter(minY + (maxY - minY) * 0.72) },
    // Mid-center pass-through
    { x: jitter(minX + (maxX - minX) * 0.5),  y: jitter(minY + (maxY - minY) * 0.55, 12) },
  ];
}
