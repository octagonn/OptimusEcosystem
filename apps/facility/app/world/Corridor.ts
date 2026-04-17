import { Container, Graphics } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface Corridor {
  view: Container;
  tick: (t: number) => void;
}

export type CorridorAxis = "horizontal" | "vertical";

export interface CorridorOpts {
  length: number;
  width: number;
  axis: CorridorAxis;
  /** Accent colors on each end — for the soft wash bleed */
  accentA: number;
  accentB: number;
  /** Flow speed of the dashed seam (negative reverses) */
  flowSpeed?: number;
}

/**
 * Connective tissue between rooms. A darker metal tube with a
 * dashed energy seam that flows between its two endpoints; the
 * wash bleeds into the neighbouring rooms' colors near each end.
 * Movement satisfies design-spells "nothing static" mandate.
 */
export function buildCorridor(opts: CorridorOpts): Corridor {
  const isH = opts.axis === "horizontal";
  const L = opts.length;
  const W = opts.width;
  const flow = opts.flowSpeed ?? 16;

  const view = new Container();

  // Frame
  const body = new Graphics();
  const [fw, fh] = isH ? [L, W] : [W, L];
  body.roundRect(0, 0, fw, fh, 3).fill({ color: PALETTE.steel900 });
  body.roundRect(0, 0, fw, fh, 3).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.8 });
  view.addChild(body);

  // Accent bleed — soft radial stubs near each end
  const bleed = new Graphics();
  const bleedR = Math.max(14, W * 0.9);
  const endStub = (x: number, y: number, color: number) => {
    for (let r = bleedR; r > 0; r -= 2) {
      const a = (1 - r / bleedR) * 0.16;
      bleed.circle(x, y, r).fill({ color, alpha: a });
    }
  };
  if (isH) {
    endStub(4, fh / 2, opts.accentA);
    endStub(fw - 4, fh / 2, opts.accentB);
  } else {
    endStub(fw / 2, 4, opts.accentA);
    endStub(fw / 2, fh - 4, opts.accentB);
  }
  view.addChild(bleed);

  // Dashed energy seam down the center
  const seam = new Graphics();
  view.addChild(seam);

  const drawSeam = (t: number) => {
    seam.clear();
    const dashL = 6;
    const gap = 6;
    const totalL = L - 8;
    const offset = (t * flow) % (dashL + gap);
    let d = 4 - offset;
    while (d < totalL + dashL) {
      const start = Math.max(4, d);
      const end = Math.min(totalL + 4, d + dashL);
      if (end > start) {
        // color interpolated along length: 0 -> A, 1 -> B
        const tcol = (start + end) / 2 / L;
        const col = tcol < 0.5 ? opts.accentA : opts.accentB;
        if (isH) {
          seam.moveTo(start, fh / 2).lineTo(end, fh / 2).stroke({ color: col, width: 2, alpha: 0.8 });
        } else {
          seam.moveTo(fw / 2, start).lineTo(fw / 2, end).stroke({ color: col, width: 2, alpha: 0.8 });
        }
      }
      d += dashL + gap;
    }
  };
  drawSeam(0);

  // Panel rivets along the wall
  const rivets = new Graphics();
  if (isH) {
    for (let x = 10; x < fw - 6; x += 14) {
      rivets.circle(x, 2.5, 0.8).fill({ color: PALETTE.steel300, alpha: 0.8 });
      rivets.circle(x, fh - 2.5, 0.8).fill({ color: PALETTE.steel300, alpha: 0.8 });
    }
  } else {
    for (let y = 10; y < fh - 6; y += 14) {
      rivets.circle(2.5, y, 0.8).fill({ color: PALETTE.steel300, alpha: 0.8 });
      rivets.circle(fw - 2.5, y, 0.8).fill({ color: PALETTE.steel300, alpha: 0.8 });
    }
  }
  view.addChild(rivets);

  return {
    view,
    tick: (t: number) => drawSeam(t),
  };
}
