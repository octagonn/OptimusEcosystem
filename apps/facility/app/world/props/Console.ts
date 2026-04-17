import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export type ScreenStyle = "wave" | "bars" | "grid" | "matrix";

export interface Console {
  view: Container;
  tick: (t: number) => void;
  width: number;
  height: number;
}

export interface ConsoleOpts {
  width: number;
  height: number;
  accent: number;
  screen: ScreenStyle;
  /** 0 = no pedestal, 1 = desk with monitor */
  style?: "flat" | "desk";
}

/**
 * Top-down console unit — metal housing + animated screen.
 * Renders at (0,0) anchor; caller positions the container.
 */
export function buildConsole(opts: ConsoleOpts): Console {
  const { width: W, height: H, accent, screen } = opts;
  const style = opts.style ?? "flat";
  const view = new Container();

  // Housing
  const housing = new Graphics();
  housing.roundRect(0, 0, W, H, 3).fill({ color: PALETTE.steel900 });
  housing.roundRect(1, 1, W - 2, H - 2, 3).fill({ color: PALETTE.steel700 });
  housing.roundRect(1, 1, W - 2, 1.5).fill({ color: PALETTE.steel400, alpha: 0.7 });
  housing.roundRect(0, 0, W, H, 3).stroke({ color: accent, width: 1, alpha: 0.85 });
  view.addChild(housing);

  // Screen inset
  const pad = 3;
  const screenX = pad;
  const screenY = pad;
  const screenW = W - pad * 2;
  const screenH = Math.max(8, H * (style === "desk" ? 0.55 : 0.7));
  const bezel = new Graphics();
  bezel.rect(screenX, screenY, screenW, screenH).fill({ color: PALETTE.charcoal });
  bezel.rect(screenX, screenY, screenW, screenH).stroke({ color: PALETTE.steel500, width: 1 });
  view.addChild(bezel);

  // Animated screen content
  const display = new Graphics();
  display.blendMode = "add";
  view.addChild(display);

  // Button row on the non-screen portion
  const buttons = new Graphics();
  const btnY = screenY + screenH + 2;
  const btnH = H - btnY - 2;
  if (btnH > 2) {
    for (let i = 0; i < 5; i++) {
      const bx = screenX + 2 + i * ((screenW - 4) / 5);
      buttons.rect(bx, btnY, (screenW - 4) / 5 - 1, btnH).fill({ color: PALETTE.steel800 });
      buttons.circle(bx + 2, btnY + btnH / 2, 0.9)
        .fill({ color: i === 0 ? accent : PALETTE.steel300, alpha: 0.9 });
    }
  }
  view.addChild(buttons);

  // Glow behind screen (blurred accent fill — picked up by bloom)
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 5, quality: 3 })];
  view.addChildAt(glow, 0);

  const drawScreen = (t: number) => {
    display.clear();
    const x0 = screenX + 1;
    const y0 = screenY + 1;
    const w = screenW - 2;
    const h = screenH - 2;

    if (screen === "wave") {
      // Scrolling waveform
      let prevX = x0;
      let prevY = y0 + h / 2;
      for (let i = 0; i <= w; i++) {
        const phase = (i / w) * Math.PI * 4 + t * 2;
        const y = y0 + h / 2 + Math.sin(phase) * (h * 0.3) + Math.sin(phase * 2.3) * (h * 0.12);
        const x = x0 + i;
        display.moveTo(prevX, prevY).lineTo(x, y).stroke({ color: accent, width: 1 });
        prevX = x; prevY = y;
      }
    } else if (screen === "bars") {
      // Bar chart
      const bars = 6;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const amp = 0.25 + Math.abs(Math.sin(t * 1.8 + i * 0.7)) * 0.7;
        const bh = h * amp;
        display.rect(x0 + i * bw + 1, y0 + h - bh, bw - 2, bh)
          .fill({ color: accent, alpha: 0.75 });
      }
    } else if (screen === "grid") {
      // Scrolling grid + scan
      const step = 4;
      for (let gy = (t * 10) % step; gy < h; gy += step) {
        display.rect(x0, y0 + gy, w, 0.5).fill({ color: accent, alpha: 0.25 });
      }
      for (let gx = 0; gx < w; gx += step) {
        display.rect(x0 + gx, y0, 0.5, h).fill({ color: accent, alpha: 0.25 });
      }
      const scanY = y0 + ((t * 14) % h);
      display.rect(x0, scanY, w, 1).fill({ color: accent, alpha: 0.9 });
    } else {
      // Matrix — scrolling dots in columns
      const cols = Math.max(4, Math.floor(w / 3));
      const cw = w / cols;
      for (let c = 0; c < cols; c++) {
        const seed = c * 0.91;
        const offset = (t * (8 + ((c * 7) % 10)) + seed * 40) % h;
        for (let r = 0; r < 3; r++) {
          const y = y0 + ((offset + r * 4) % h);
          const a = 0.85 - r * 0.25;
          display.rect(x0 + c * cw, y, cw - 0.5, 1.2).fill({ color: accent, alpha: a });
        }
      }
    }

    // Scanline overlay (tint)
    for (let i = 0; i < h; i += 2) {
      display.rect(x0, y0 + i, w, 1).fill({ color: PALETTE.charcoal, alpha: 0.18 });
    }

    // Screen glow behind
    glow.clear();
    glow.rect(screenX - 2, screenY - 2, screenW + 4, screenH + 4)
      .fill({ color: accent, alpha: 0.18 });
  };

  drawScreen(0);

  return {
    view,
    width: W,
    height: H,
    tick: (t: number) => drawScreen(t),
  };
}
