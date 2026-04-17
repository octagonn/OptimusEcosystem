import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface PipeSegment {
  x1: number; y1: number; x2: number; y2: number;
}

export interface PipeOpts {
  segments: PipeSegment[];
  color: number;
  thickness?: number;
  flow?: boolean;
}

export interface Pipe {
  view: Container;
  tick: (t: number) => void;
}

/**
 * Neon conduit running through a series of axis-aligned segments.
 * Each joint gets a connector cap; optional flowing dash traces along
 * the path for a "data moving through cable" effect.
 */
export function buildPipe(opts: PipeOpts): Pipe {
  const { segments, color } = opts;
  const thick = opts.thickness ?? 5;
  const view = new Container();

  // Pipe body — dark core
  const body = new Graphics();
  for (const s of segments) {
    if (s.x1 === s.x2) {
      const ymin = Math.min(s.y1, s.y2);
      const ymax = Math.max(s.y1, s.y2);
      body.rect(s.x1 - thick / 2, ymin, thick, ymax - ymin)
        .fill({ color: PALETTE.steel900 });
      body.rect(s.x1 - thick / 2, ymin, thick, ymax - ymin)
        .stroke({ color: PALETTE.steel500, width: 0.6 });
      body.rect(s.x1 - thick / 2 + 1, ymin, 1, ymax - ymin)
        .fill({ color: PALETTE.steel400, alpha: 0.8 });
    } else {
      const xmin = Math.min(s.x1, s.x2);
      const xmax = Math.max(s.x1, s.x2);
      body.rect(xmin, s.y1 - thick / 2, xmax - xmin, thick)
        .fill({ color: PALETTE.steel900 });
      body.rect(xmin, s.y1 - thick / 2, xmax - xmin, thick)
        .stroke({ color: PALETTE.steel500, width: 0.6 });
      body.rect(xmin, s.y1 - thick / 2 + 1, xmax - xmin, 1)
        .fill({ color: PALETTE.steel400, alpha: 0.8 });
    }
  }
  // Joint caps
  const joints = new Set<string>();
  for (const s of segments) {
    joints.add(`${s.x1},${s.y1}`);
    joints.add(`${s.x2},${s.y2}`);
  }
  for (const key of joints) {
    const [jx, jy] = key.split(",").map(Number);
    body.circle(jx, jy, thick / 2 + 1).fill({ color: PALETTE.steel600 });
    body.circle(jx, jy, thick / 2 + 1).stroke({ color: PALETTE.steel400, width: 0.6 });
    body.circle(jx, jy, 1).fill({ color, alpha: 0.9 });
  }
  view.addChild(body);

  // Glow layer
  if (opts.flow !== false) {
    const glow = new Graphics();
    glow.blendMode = "add";
    glow.filters = [new BlurFilter({ strength: 3, quality: 3 })];
    view.addChild(glow);

    const drawFlow = (t: number) => {
      glow.clear();
      for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        if (len < 2) continue;
        const dirX = (s.x2 - s.x1) / len;
        const dirY = (s.y2 - s.y1) / len;
        const dashL = 10;
        const gap = 20;
        const flow = (t * 25 + i * 8) % (dashL + gap);
        for (let d = -dashL + flow; d < len; d += dashL + gap) {
          const a = Math.max(0, Math.min(dashL, len - d));
          if (a <= 0) continue;
          const start = Math.max(0, d);
          const end = Math.min(len, d + dashL);
          const x1 = s.x1 + dirX * start;
          const y1 = s.y1 + dirY * start;
          const x2 = s.x1 + dirX * end;
          const y2 = s.y1 + dirY * end;
          glow.moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width: thick - 2, alpha: 0.7 });
        }
      }
    };
    drawFlow(0);
    return {
      view,
      tick: (t: number) => drawFlow(t),
    };
  }

  return { view, tick: () => {} };
}
