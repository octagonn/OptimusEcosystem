import { Container, Graphics } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface AnimatedStarfield {
  view: Container;
  tick: (t: number) => void;
}

/**
 * Twinkling starfield with 3 parallax layers.
 * Applying game-art §3 (hierarchy: distant dim, near bright) and
 * design-spells (every surface gets motion — even "empty" void).
 */
export function drawStarfield(w: number, h: number): AnimatedStarfield {
  const view = new Container();

  // backdrop void
  const bg = new Graphics();
  bg.rect(0, 0, w, h).fill({ color: PALETTE.void });
  view.addChild(bg);

  // deterministic pseudo-random
  let seed = 1337;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  const layers: { g: Graphics; stars: Array<{ x: number; y: number; base: number; phase: number; speed: number; size: number }> }[] = [];

  for (let li = 0; li < 3; li++) {
    const g = new Graphics();
    const count = li === 0 ? 180 : li === 1 ? 80 : 30;
    const stars: typeof layers[number]["stars"] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand() * w,
        y: rand() * h,
        base: 0.2 + rand() * 0.5 + li * 0.1,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 1.8,
        size: li === 2 ? 2 : 1,
      });
    }
    layers.push({ g, stars });
    view.addChild(g);
  }

  // pre-draw once, repaint alpha each tick by clearing
  const tick = (t: number) => {
    for (const { g, stars } of layers) {
      g.clear();
      for (const s of stars) {
        const a = Math.max(0, Math.min(1, s.base + Math.sin(t * s.speed + s.phase) * 0.25));
        g.rect(s.x, s.y, s.size, s.size).fill({ color: PALETTE.steel100, alpha: a });
      }
    }
  };
  tick(0);

  return { view, tick };
}
