import { Container, Graphics } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

/**
 * Ambient dust-mote particle system — pooled per web-games §7 (object
 * pooling to avoid GC). Adds "magic" per design-spells.
 */
export function createDustMotes(w: number, h: number, count = 60) {
  const view = new Container();
  const g = new Graphics();
  view.addChild(g);

  const motes = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.05,
    base: 0.15 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
  }));

  const tick = (t: number, dt: number) => {
    g.clear();
    for (const m of motes) {
      m.x += m.vx * dt * 60;
      m.y += m.vy * dt * 60;
      if (m.x < 0) m.x = w;
      if (m.x > w) m.x = 0;
      if (m.y < 0) m.y = h;
      if (m.y > h) m.y = 0;
      const a = m.base + Math.sin(t * 1.5 + m.phase) * 0.15;
      g.circle(m.x, m.y, 0.7).fill({ color: PALETTE.steel100, alpha: a });
    }
  };

  return { view, tick };
}
