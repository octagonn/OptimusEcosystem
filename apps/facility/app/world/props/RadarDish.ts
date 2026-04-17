import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface RadarDish {
  view: Container;
  tick: (t: number) => void;
}

export interface RadarDishOpts {
  size: number;
  accent: number;
  /** Rotation speed (rad/s) */
  speed?: number;
}

/** Small top-down radar dish with a slowly rotating arm. */
export function buildRadarDish(opts: RadarDishOpts): RadarDish {
  const s = opts.size;
  const accent = opts.accent;
  const speed = opts.speed ?? 0.8;
  const view = new Container();

  // Base
  const base = new Graphics();
  base.circle(0, 0, s * 0.55).fill({ color: PALETTE.steel800 });
  base.circle(0, 0, s * 0.55).stroke({ color: accent, width: 1, alpha: 0.9 });
  base.circle(0, 0, s * 0.4).fill({ color: PALETTE.steel700 });
  base.circle(0, 0, s * 0.18).fill({ color: accent, alpha: 0.8 });
  base.circle(0, 0, s * 0.08).fill({ color: PALETTE.ivory, alpha: 0.9 });
  view.addChild(base);

  // Mount bolts
  const bolts = new Graphics();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    bolts.circle(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.48, 1)
      .fill({ color: PALETTE.steel400 });
  }
  view.addChild(bolts);

  // Rotating arm
  const arm = new Container();
  const armG = new Graphics();
  armG.rect(0, -1, s * 0.5, 2).fill({ color: PALETTE.steel300 });
  armG.rect(s * 0.45, -2, 3, 4).fill({ color: accent });
  arm.addChild(armG);
  view.addChild(arm);

  // Sweep glow
  const sweep = new Graphics();
  sweep.blendMode = "add";
  sweep.filters = [new BlurFilter({ strength: 3, quality: 2 })];
  view.addChild(sweep);

  return {
    view,
    tick: (t: number) => {
      arm.rotation = t * speed;
      sweep.clear();
      const a = 0.55 + Math.sin(t * speed * 2) * 0.2;
      sweep.circle(0, 0, s * 0.6).fill({ color: accent, alpha: 0.1 * a });
    },
  };
}
