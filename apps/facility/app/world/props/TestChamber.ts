import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface TestChamber {
  view: Container;
  tick: (t: number) => void;
}

export interface TestChamberOpts {
  width: number;
  height: number;
  accent: number;
}

/**
 * Glass test chamber — hazard-taped frame, bright interior, little
 * specimen rig in the middle (forearm/rotor-style). Matches the Anvil
 * Bay reference.
 */
export function buildTestChamber(opts: TestChamberOpts): TestChamber {
  const { width: W, height: H, accent } = opts;
  const view = new Container();

  // Outer frame with hazard tape diagonals
  const frame = new Graphics();
  const thick = 4;
  frame.rect(0, 0, W, H).fill({ color: PALETTE.charcoal });
  // Hazard tape diagonals on outer band
  const stripe = 6;
  for (let s = 0; s < (W + H) / stripe; s++) {
    const c = s % 2 === 0 ? PALETTE.warningGold : PALETTE.charcoal;
    const p = s * stripe;
    // top band
    frame.moveTo(p - thick, 0).lineTo(p, 0).lineTo(p + thick, thick).lineTo(p, thick).closePath()
      .fill({ color: c });
    // bottom band
    frame.moveTo(p - thick, H - thick).lineTo(p, H - thick).lineTo(p + thick, H).lineTo(p, H).closePath()
      .fill({ color: c });
    // left band
    frame.moveTo(0, p - thick).lineTo(0, p).lineTo(thick, p + thick).lineTo(thick, p).closePath()
      .fill({ color: c });
    // right band
    frame.moveTo(W - thick, p - thick).lineTo(W - thick, p).lineTo(W, p + thick).lineTo(W, p).closePath()
      .fill({ color: c });
  }
  view.addChild(frame);

  // Interior (lit)
  const inner = new Graphics();
  inner.rect(thick, thick, W - thick * 2, H - thick * 2).fill({ color: PALETTE.steel700 });
  inner.rect(thick, thick, W - thick * 2, H - thick * 2).stroke({ color: PALETTE.steel300, width: 1 });
  view.addChild(inner);

  // Glass reflection highlight
  const glass = new Graphics();
  glass.rect(thick + 2, thick + 2, (W - thick * 2) * 0.35, 1.5)
    .fill({ color: PALETTE.ivory, alpha: 0.35 });
  view.addChild(glass);

  // Specimen — small rig
  const specimen = new Graphics();
  const cx = W / 2;
  const cy = H / 2;
  specimen.rect(cx - 8, cy - 5, 16, 10).fill({ color: PALETTE.steel500 });
  specimen.rect(cx - 8, cy - 5, 16, 10).stroke({ color: PALETTE.steel300, width: 1 });
  specimen.rect(cx - 10, cy - 1, 4, 2).fill({ color: PALETTE.steel300 });
  specimen.rect(cx + 6, cy - 1, 4, 2).fill({ color: PALETTE.steel300 });
  specimen.circle(cx, cy - 8, 3).fill({ color: PALETTE.steel400 });
  specimen.circle(cx, cy - 8, 3).stroke({ color: accent, width: 1, alpha: 0.8 });
  view.addChild(specimen);

  // Top-down light cone from ceiling
  const light = new Graphics();
  light.blendMode = "add";
  light.filters = [new BlurFilter({ strength: 3, quality: 2 })];
  const drawLight = (k: number) => {
    light.clear();
    for (let rr = 18; rr > 0; rr -= 2) {
      const a = (1 - rr / 18) * 0.18 * k;
      light.ellipse(cx, cy, rr * 1.1, rr * 0.7).fill({ color: PALETTE.ivory, alpha: a });
    }
  };
  drawLight(1);
  view.addChild(light);

  return {
    view,
    tick: (t: number) => {
      drawLight(0.85 + Math.sin(t * 2.5) * 0.15);
    },
  };
}
