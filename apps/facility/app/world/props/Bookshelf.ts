import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface Bookshelf {
  view: Container;
  tick: (t: number) => void;
}

export interface BookshelfOpts {
  width: number;
  height: number;
  accent: number;
  rows?: number;
}

/**
 * Top-down bookshelf — each row is a band of vertical "spine" rectangles
 * with varied widths and colors. A few spines phosphoresce (bloom pass).
 */
export function buildBookshelf(opts: BookshelfOpts): Bookshelf {
  const { width: W, height: H, accent } = opts;
  const rows = opts.rows ?? 2;
  const view = new Container();

  // Shelf backer
  const backer = new Graphics();
  backer.rect(0, 0, W, H).fill({ color: PALETTE.charcoal });
  backer.rect(0, 0, W, H).stroke({ color: accent, width: 1, alpha: 0.75 });
  view.addChild(backer);

  // Row dividers
  const rowH = H / rows;
  type Spine = { x: number; y: number; w: number; h: number; c: number; glow: boolean; seed: number };
  const spines: Spine[] = [];
  const spineColors = [
    PALETTE.steel500,
    PALETTE.steel400,
    PALETTE.steel600,
    PALETTE.lore,
    PALETTE.anvil,
    PALETTE.steel300,
  ];

  for (let r = 0; r < rows; r++) {
    let x = 2;
    const y = r * rowH + 2;
    const h = rowH - 4;
    while (x < W - 2) {
      const sw = 2 + Math.floor(Math.random() * 4);
      if (x + sw > W - 2) break;
      spines.push({
        x, y, w: sw, h,
        c: spineColors[(Math.random() * spineColors.length) | 0],
        glow: Math.random() < 0.15,
        seed: Math.random() * Math.PI * 2,
      });
      x += sw + 1;
    }
    // Shelf line
    backer.rect(0, (r + 1) * rowH - 1, W, 1).fill({ color: PALETTE.steel400, alpha: 0.6 });
  }

  // Static spines
  const shelf = new Graphics();
  for (const s of spines) {
    shelf.rect(s.x, s.y, s.w, s.h).fill({ color: s.c });
    shelf.rect(s.x, s.y, s.w, 0.5).fill({ color: PALETTE.ivory, alpha: 0.2 });
  }
  view.addChild(shelf);

  // Glow spines (additive, flicker)
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(glow);

  const drawGlow = (t: number) => {
    glow.clear();
    for (const s of spines) {
      if (!s.glow) continue;
      const a = 0.5 + Math.abs(Math.sin(t * 1.3 + s.seed)) * 0.5;
      glow.rect(s.x, s.y, s.w, s.h).fill({ color: accent, alpha: a });
    }
  };
  drawGlow(0);

  return {
    view,
    tick: (t: number) => drawGlow(t),
  };
}
