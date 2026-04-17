import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface HoloTable {
  view: Container;
  tick: (t: number) => void;
}

export interface HoloTableOpts {
  radius: number;
  accent: number;
  /** What projects above the table */
  content?: "globe" | "rings" | "core" | "triangle";
}

/**
 * Central floor-mounted holo-table — a slab pedestal with concentric
 * accent rings and a volumetric glow column above it. Content varies by room.
 */
export function buildHoloTable(opts: HoloTableOpts): HoloTable {
  const r = opts.radius;
  const accent = opts.accent;
  const content = opts.content ?? "rings";
  const view = new Container();

  // Pedestal slab
  const slab = new Graphics();
  slab.circle(0, 0, r).fill({ color: PALETTE.steel900 });
  slab.circle(0, 0, r).stroke({ color: accent, width: 1, alpha: 0.9 });
  slab.circle(0, 0, r - 4).fill({ color: PALETTE.steel800 });
  slab.circle(0, 0, r - 4).stroke({ color: accent, width: 0.8, alpha: 0.6 });
  // Accent spokes
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    slab.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8))
      .lineTo(Math.cos(a) * (r - 1), Math.sin(a) * (r - 1))
      .stroke({ color: accent, width: 1, alpha: 0.7 });
  }
  view.addChild(slab);

  // Volumetric glow
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 6, quality: 3 })];
  const drawGlow = (k: number) => {
    glow.clear();
    for (let rr = r * 1.1; rr > 0; rr -= 3) {
      const a = (1 - rr / (r * 1.1)) * 0.2 * k;
      glow.circle(0, 0, rr).fill({ color: accent, alpha: a });
    }
  };
  drawGlow(1);
  view.addChild(glow);

  // Projected content
  const proj = new Graphics();
  proj.blendMode = "add";
  view.addChild(proj);

  const drawProjection = (t: number) => {
    proj.clear();
    if (content === "rings") {
      const tiers = [
        { r: r * 0.7, speed: 0.6, dir: 1, seg: 8 },
        { r: r * 0.5, speed: 1.0, dir: -1, seg: 5 },
        { r: r * 0.3, speed: 1.5, dir: 1, seg: 3 },
      ];
      for (const ring of tiers) {
        const step = (Math.PI * 2) / (ring.seg * 2);
        for (let i = 0; i < ring.seg; i++) {
          const a = t * ring.speed * ring.dir + (i / ring.seg) * Math.PI * 2;
          const x1 = Math.cos(a) * ring.r;
          const y1 = Math.sin(a) * ring.r;
          const x2 = Math.cos(a + step) * ring.r;
          const y2 = Math.sin(a + step) * ring.r;
          proj.moveTo(x1, y1).lineTo(x2, y2)
            .stroke({ color: accent, width: 2, alpha: 0.9 });
        }
      }
      proj.circle(0, 0, 3).fill({ color: PALETTE.ivory, alpha: 0.9 });
    } else if (content === "globe") {
      // Rotating wireframe sphere (ellipses)
      const wobble = Math.sin(t * 0.6) * 0.3 + 1;
      for (let i = 0; i < 5; i++) {
        const rr = r * 0.55;
        const rx = Math.max(1, rr * Math.abs(Math.cos(t * 0.8 + i * 0.6)) * wobble);
        const ry = rr;
        proj.ellipse(0, 0, rx, ry).stroke({ color: accent, width: 1, alpha: 0.85 });
      }
      proj.circle(0, 0, 2.5).fill({ color: PALETTE.hologramTeal, alpha: 0.95 });
    } else if (content === "triangle") {
      // Triangular prism slowly rotating
      const s = r * 0.45;
      const rot = t * 0.5;
      const pts: [number, number][] = [];
      for (let i = 0; i < 3; i++) {
        const a = rot + (i / 3) * Math.PI * 2;
        pts.push([Math.cos(a) * s, Math.sin(a) * s * 0.8]);
      }
      proj.moveTo(pts[0][0], pts[0][1])
        .lineTo(pts[1][0], pts[1][1])
        .lineTo(pts[2][0], pts[2][1])
        .closePath()
        .stroke({ color: accent, width: 2, alpha: 0.9 });
      // Floating core inside
      proj.circle(0, 0, 3 + Math.sin(t * 2) * 1).fill({ color: accent, alpha: 0.65 });
    } else {
      // core — a pulsing sun
      const p = 0.6 + Math.sin(t * 2) * 0.3;
      for (let rr = r * 0.5 * p; rr > 0; rr -= 2) {
        const a = (1 - rr / (r * 0.5 * p)) * 0.35;
        proj.circle(0, 0, rr).fill({ color: accent, alpha: a });
      }
      proj.circle(0, 0, 3).fill({ color: PALETTE.ivory, alpha: 0.95 });
    }
  };
  drawProjection(0);

  return {
    view,
    tick: (t: number) => {
      drawGlow(0.8 + Math.sin(t * 1.3) * 0.2);
      drawProjection(t);
    },
  };
}
