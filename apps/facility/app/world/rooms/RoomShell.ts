import {
  Container,
  Graphics,
  Text,
  TextStyle,
  BlurFilter,
} from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface RoomShellOpts {
  width: number;
  height: number;
  accent: number;
  washIntensity?: number;
  label?: string;
  labelCode?: string;
}

export interface RoomShell {
  view: Container;
  inner: Container;
  tick: (t: number) => void;
  width: number;
  height: number;
}

const TILE = 28;
const WALL = 14;

/**
 * Procedural room chassis.
 *
 * Layers from back to front:
 *   1. Outer wall band (dark steel, beveled)
 *   2. Interior tile floor (steel base + per-tile panel seams + scuff noise)
 *   3. Accent seam strips running N-S and E-W through the room center
 *   4. Corner conduit L-brackets
 *   5. Radial accent wash (breathing)
 *   6. `inner` layer for the room's own props/motion
 *   7. Perimeter neon trim (additive, blurred — bloomed in post)
 *   8. Vignette + header label
 */
export function createRoomShell(opts: RoomShellOpts): RoomShell {
  const W = opts.width;
  const H = opts.height;
  const accent = opts.accent;
  const washK = opts.washIntensity ?? 0.7;

  const view = new Container();

  // ── 1. Card mask so nothing leaks past the rounded corners
  const mask = new Graphics();
  mask.roundRect(0, 0, W, H, 8).fill({ color: 0xffffff });
  view.addChild(mask);
  view.mask = mask;

  // ── 2. Outer wall band (dark steel frame around interior)
  const wall = new Graphics();
  wall.rect(0, 0, W, H).fill({ color: PALETTE.steel900 });
  // Inner bevel
  wall.rect(WALL - 2, WALL - 2, W - (WALL - 2) * 2, H - (WALL - 2) * 2)
    .fill({ color: PALETTE.charcoal });
  view.addChild(wall);

  // ── 3. Interior tile floor — baked once, never redrawn
  const floorX = WALL;
  const floorY = WALL;
  const floorW = W - WALL * 2;
  const floorH = H - WALL * 2;

  const floor = new Graphics();
  // Base plate
  floor.rect(floorX, floorY, floorW, floorH).fill({ color: PALETTE.steel800 });

  // Per-tile subtle fill variation (pseudo-random, seeded from position)
  const seed = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let ty = 0; ty < floorH / TILE; ty++) {
    for (let tx = 0; tx < floorW / TILE; tx++) {
      const x = floorX + tx * TILE;
      const y = floorY + ty * TILE;
      const s = seed(tx, ty);
      // Tile body — very subtle lightness variation; most tiles are base
      const tint = s < 0.12 ? PALETTE.steel700 : s < 0.92 ? PALETTE.steel800 : PALETTE.steel900;
      floor.rect(x + 1, y + 1, TILE - 2, TILE - 2).fill({ color: tint });

      // Gentle bevel — top-left highlight
      floor.rect(x + 1, y + 1, TILE - 2, 1).fill({ color: PALETTE.steel600, alpha: 0.35 });
      floor.rect(x + 1, y + 1, 1, TILE - 2).fill({ color: PALETTE.steel600, alpha: 0.35 });
      // Bottom-right shadow
      floor.rect(x + 1, y + TILE - 2, TILE - 2, 1).fill({ color: PALETTE.charcoal, alpha: 0.5 });
      floor.rect(x + TILE - 2, y + 1, 1, TILE - 2).fill({ color: PALETTE.charcoal, alpha: 0.5 });

      // Sparse rivets — only ~4% of tiles get a corner rivet, no random scuffs
      if (s > 0.96) {
        floor.circle(x + 3, y + 3, 0.8).fill({ color: PALETTE.steel500, alpha: 0.8 });
      }
    }
  }
  view.addChild(floor);

  // ── 4. Accent seam strips — cross running through middle
  const seam = new Graphics();
  seam.rect(floorX, H / 2 - 2, floorW, 4).fill({ color: PALETTE.charcoal });
  seam.rect(floorX, H / 2 - 1, floorW, 2).fill({ color: accent, alpha: 0.35 });
  seam.rect(W / 2 - 2, floorY, 4, floorH).fill({ color: PALETTE.charcoal });
  seam.rect(W / 2 - 1, floorY, 2, floorH).fill({ color: accent, alpha: 0.35 });
  view.addChild(seam);

  // ── 5. Door openings — top, bottom, left, right mid-edges
  const doors = new Graphics();
  const doorW = 42;
  const doorH = 42;
  doors.rect(W / 2 - doorW / 2, 0, doorW, WALL).fill({ color: PALETTE.charcoal });
  doors.rect(W / 2 - doorW / 2, H - WALL, doorW, WALL).fill({ color: PALETTE.charcoal });
  doors.rect(0, H / 2 - doorH / 2, WALL, doorH).fill({ color: PALETTE.charcoal });
  doors.rect(W - WALL, H / 2 - doorH / 2, WALL, doorH).fill({ color: PALETTE.charcoal });
  // Accent lips on each door
  doors.rect(W / 2 - doorW / 2, WALL - 2, doorW, 2).fill({ color: accent, alpha: 0.9 });
  doors.rect(W / 2 - doorW / 2, H - WALL, doorW, 2).fill({ color: accent, alpha: 0.9 });
  doors.rect(WALL - 2, H / 2 - doorH / 2, 2, doorH).fill({ color: accent, alpha: 0.9 });
  doors.rect(W - WALL, H / 2 - doorH / 2, 2, doorH).fill({ color: accent, alpha: 0.9 });
  view.addChild(doors);

  // ── 6. Corner conduit L-brackets
  const conduits = new Graphics();
  const clen = 68;
  const cthick = 5;
  const corners = [
    { x: WALL + 4,           y: WALL + 4,           dx: 1,  dy: 1  },
    { x: W - WALL - 4,       y: WALL + 4,           dx: -1, dy: 1  },
    { x: WALL + 4,           y: H - WALL - 4,       dx: 1,  dy: -1 },
    { x: W - WALL - 4,       y: H - WALL - 4,       dx: -1, dy: -1 },
  ];
  for (const c of corners) {
    const x = c.dx > 0 ? c.x : c.x - clen;
    const y = c.dy > 0 ? c.y : c.y - cthick;
    conduits.rect(x, y, clen, cthick).fill({ color: PALETTE.steel400 });
    conduits.rect(x, y, clen, 1).fill({ color: PALETTE.steel200, alpha: 0.7 });
    // perpendicular arm
    const ax = c.dx > 0 ? c.x : c.x - cthick;
    const ay = c.dy > 0 ? c.y : c.y - clen;
    conduits.rect(ax, ay, cthick, clen).fill({ color: PALETTE.steel400 });
    conduits.rect(ax, ay, 1, clen).fill({ color: PALETTE.steel200, alpha: 0.7 });
    // accent notch at the elbow
    conduits.rect(c.dx > 0 ? c.x : c.x - cthick, c.dy > 0 ? c.y : c.y - cthick, cthick, cthick)
      .fill({ color: accent, alpha: 0.9 });
  }
  view.addChild(conduits);

  // ── 7. Breathing radial accent wash
  const wash = new Graphics();
  const drawWash = (pulse: number) => {
    wash.clear();
    const maxR = Math.max(W, H) * 0.6;
    for (let r = maxR; r > 0; r -= 14) {
      const a = (0.02 + (1 - r / maxR) * 0.06) * pulse * washK;
      wash.circle(W / 2, H / 2, r).fill({ color: accent, alpha: a });
    }
  };
  drawWash(1);
  wash.blendMode = "add";
  view.addChild(wash);

  // ── 8. Inner container — rooms add their props here
  const inner = new Container();
  view.addChild(inner);

  // ── 9. Perimeter neon trim — additive + blurred for bloom
  const trim = new Graphics();
  trim.blendMode = "add";
  trim.filters = [new BlurFilter({ strength: 3, quality: 3 })];
  // Inset inner rect
  const tInset = WALL - 1;
  trim
    .roundRect(tInset, tInset, W - tInset * 2, H - tInset * 2, 4)
    .stroke({ color: accent, width: 2, alpha: 0.9 });
  trim
    .roundRect(tInset, tInset, W - tInset * 2, H - tInset * 2, 4)
    .stroke({ color: accent, width: 4, alpha: 0.35 });
  view.addChild(trim);

  // Crisp inner edge (non-blurred — sharp line on top of the glow)
  const edge = new Graphics();
  edge
    .roundRect(tInset, tInset, W - tInset * 2, H - tInset * 2, 4)
    .stroke({ color: accent, width: 1, alpha: 0.95 });
  view.addChild(edge);

  // ── 10. Vignette (corners dim)
  const vignette = new Graphics();
  const vmaxR = Math.max(W, H) * 0.9;
  for (let r = vmaxR; r > vmaxR * 0.6; r -= 8) {
    const a = 0.04 * ((r - vmaxR * 0.6) / (vmaxR * 0.4));
    vignette.circle(W / 2, H / 2, r).fill({ color: 0x000000, alpha: a });
  }
  view.addChild(vignette);

  // ── 11. Corner rivets
  const rivets = new Graphics();
  for (const [rx, ry] of [[WALL, WALL], [W - WALL, WALL], [WALL, H - WALL], [W - WALL, H - WALL]] as const) {
    rivets.circle(rx, ry, 3.2).fill({ color: PALETTE.steel400 });
    rivets.circle(rx, ry, 1.6).fill({ color: accent, alpha: 0.9 });
    rivets.circle(rx, ry, 0.6).fill({ color: PALETTE.ivory });
  }
  view.addChild(rivets);

  // ── 12. Header label
  if (opts.label) {
    const style = new TextStyle({
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 2,
      fill: accent,
      align: "left",
    });
    const label = new Text({ text: opts.label.toUpperCase(), style });
    label.alpha = 0.95;

    const pill = new Graphics();
    const pillW = Math.min(W - 60, label.width + 16);
    pill.roundRect(WALL + 4, WALL - 6, pillW, 18, 3).fill({ color: PALETTE.charcoal });
    pill.roundRect(WALL + 4, WALL - 6, pillW, 18, 3).stroke({ color: accent, width: 1, alpha: 0.9 });
    view.addChild(pill);

    label.position.set(WALL + 12, WALL - 3);
    view.addChild(label);

    if (opts.labelCode) {
      const codeStyle = new TextStyle({
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 8,
        letterSpacing: 1,
        fill: PALETTE.steel100,
      });
      const code = new Text({ text: opts.labelCode, style: codeStyle });
      code.alpha = 0.8;
      const codePillW = code.width + 10;
      const codePill = new Graphics();
      codePill
        .roundRect(W - WALL - 4 - codePillW, WALL - 6, codePillW, 18, 3)
        .fill({ color: PALETTE.charcoal })
        .stroke({ color: PALETTE.steel500, width: 1, alpha: 0.65 });
      view.addChild(codePill);
      code.position.set(W - WALL - 4 - codePillW + 5, WALL - 2);
      view.addChild(code);
    }
  }

  const tick = (t: number) => {
    const pulse = 0.75 + Math.sin(t * 1.2) * 0.25;
    drawWash(pulse);
  };

  return { view, inner, tick, width: W, height: H };
}
