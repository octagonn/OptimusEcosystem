import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface Machine {
  view: Container;
  tick: (t: number) => void;
  width: number;
  height: number;
}

export interface MachineOpts {
  width: number;
  height: number;
  accent: number;
  /** Which edge emits sparks / a glowing port */
  emitter?: "n" | "s" | "e" | "w";
  /** Type influences surface greebling */
  kind?: "cnc" | "server" | "generator";
}

/**
 * Industrial machine box — chassis, LED strip, surface greebles, optional
 * emitter port that spits sparks/heat. CNC has clamp & bit, server has
 * rack slots, generator has capacitor bumps.
 */
export function buildMachine(opts: MachineOpts): Machine {
  const { width: W, height: H, accent } = opts;
  const kind = opts.kind ?? "cnc";
  const view = new Container();

  // Chassis
  const chassis = new Graphics();
  chassis.roundRect(0, 0, W, H, 4).fill({ color: PALETTE.steel800 });
  chassis.roundRect(1, 1, W - 2, H - 2, 3).fill({ color: PALETTE.steel700 });
  chassis.roundRect(0, 0, W, H, 4).stroke({ color: accent, width: 1, alpha: 0.85 });
  // Top plate highlight
  chassis.rect(2, 2, W - 4, 2).fill({ color: PALETTE.steel400, alpha: 0.6 });
  // Bottom shadow
  chassis.rect(2, H - 3, W - 4, 1).fill({ color: PALETTE.charcoal, alpha: 0.7 });
  view.addChild(chassis);

  // Surface greebling per kind
  if (kind === "cnc") {
    // Clamp outline
    const clamp = new Graphics();
    clamp.rect(W * 0.25, H * 0.25, W * 0.5, H * 0.5).fill({ color: PALETTE.steel900 });
    clamp.rect(W * 0.25, H * 0.25, W * 0.5, H * 0.5).stroke({ color: PALETTE.steel400, width: 1 });
    clamp.rect(W * 0.42, H * 0.38, W * 0.16, H * 0.24).fill({ color: PALETTE.steel800 });
    clamp.circle(W / 2, H / 2, 2).fill({ color: accent, alpha: 0.9 });
    view.addChild(clamp);
  } else if (kind === "server") {
    // Rack slots
    const slots = new Graphics();
    const rows = Math.floor(H / 6);
    for (let i = 0; i < rows; i++) {
      const y = 4 + i * 6;
      if (y + 4 > H - 4) break;
      slots.rect(3, y, W - 6, 3).fill({ color: PALETTE.charcoal });
      slots.rect(3, y, 2, 3).fill({ color: accent, alpha: 0.85 });
      slots.rect(W - 7, y, 3, 3).fill({ color: PALETTE.steel400 });
    }
    view.addChild(slots);
  } else {
    // Generator — capacitor bumps
    const caps = new Graphics();
    const cols = 3;
    const rows = 2;
    const pad = 4;
    const cw = (W - pad * 2) / cols;
    const ch = (H - pad * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        caps.circle(pad + cw * c + cw / 2, pad + ch * r + ch / 2, Math.min(cw, ch) * 0.35)
          .fill({ color: PALETTE.steel900 })
          .stroke({ color: accent, width: 1, alpha: 0.7 });
      }
    }
    view.addChild(caps);
  }

  // LED strip — runs along an edge
  const ledCount = 5;
  const leds = new Graphics();
  const drawLeds = (t: number) => {
    leds.clear();
    for (let i = 0; i < ledCount; i++) {
      const x = 4 + i * ((W - 8) / (ledCount - 1));
      const y = H - 2;
      const a = 0.4 + Math.abs(Math.sin(t * 2.2 + i * 0.9)) * 0.6;
      leds.circle(x, y, 1).fill({ color: accent, alpha: a });
    }
  };
  drawLeds(0);
  view.addChild(leds);

  // Emitter port (if set) + spark pool
  let drawSparks: (t: number) => void = () => {};
  if (opts.emitter) {
    type Spark = { x: number; y: number; vx: number; vy: number; life: number };
    const pool: Spark[] = Array.from({ length: 10 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
    const sparkLayer = new Graphics();
    sparkLayer.blendMode = "add";
    sparkLayer.filters = [new BlurFilter({ strength: 2, quality: 2 })];
    view.addChild(sparkLayer);

    const emitter = opts.emitter;
    const ex = emitter === "w" ? 0 : emitter === "e" ? W : W / 2;
    const ey = emitter === "n" ? 0 : emitter === "s" ? H : H / 2;
    const vDirX = emitter === "w" ? -1 : emitter === "e" ? 1 : 0;
    const vDirY = emitter === "n" ? -1 : emitter === "s" ? 1 : 0;

    // Port ring
    const port = new Graphics();
    port.circle(ex, ey, 3).fill({ color: PALETTE.charcoal });
    port.circle(ex, ey, 3).stroke({ color: accent, width: 1.2 });
    port.circle(ex, ey, 1.2).fill({ color: PALETTE.warningGold, alpha: 0.95 });
    view.addChild(port);

    let tLast = 0;
    drawSparks = (t: number) => {
      const dt = Math.min(0.1, t - tLast);
      tLast = t;
      // spawn
      if (Math.random() < 0.55) {
        const s = pool.find((p) => p.life <= 0);
        if (s) {
          s.x = ex;
          s.y = ey;
          s.vx = vDirX * (20 + Math.random() * 25) + (Math.random() - 0.5) * 14;
          s.vy = vDirY * (20 + Math.random() * 25) + (Math.random() - 0.5) * 14;
          s.life = 0.5 + Math.random() * 0.4;
        }
      }
      sparkLayer.clear();
      for (const s of pool) {
        if (s.life <= 0) continue;
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 18 * dt;
        const a = Math.max(0, s.life / 0.9);
        sparkLayer.circle(s.x, s.y, 1.2).fill({ color: PALETTE.warningGold, alpha: a });
        sparkLayer.circle(s.x, s.y, 3).fill({ color: accent, alpha: a * 0.4 });
      }
    };
  }

  return {
    view,
    width: W,
    height: H,
    tick: (t: number) => {
      drawLeds(t);
      drawSparks(t);
    },
  };
}
