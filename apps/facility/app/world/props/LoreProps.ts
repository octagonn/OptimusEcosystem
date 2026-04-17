import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface LoreProp {
  view: Container;
  tick: (t: number) => void;
}

const noop = (_: number) => {};

// Glyph characters used as orbiting runes around the codex.
const GLYPHS = ["☉", "☽", "✦", "✧", "✺", "❖", "✶", "⁂", "⌬", "⊛", "✷", "✸"];

// ═══════════════════ ANCIENT CODEX ═══════════════════
// Open book on lectern with turning pages + orbiting glyph particles.

export function buildAncientCodex(opts: {
  width?: number;
  accent?: number;
}): LoreProp {
  const w = opts.width ?? 64;
  const accent = opts.accent ?? PALETTE.lore;
  const view = new Container();

  // Lectern (perspective-ish slanted base)
  const lectern = new Graphics();
  lectern.poly([-w / 2 - 4, 12, w / 2 + 4, 12, w / 2 + 8, 22, -w / 2 - 8, 22])
    .fill({ color: PALETTE.steel800 });
  lectern.poly([-w / 2 - 4, 12, w / 2 + 4, 12, w / 2 + 8, 22, -w / 2 - 8, 22])
    .stroke({ color: PALETTE.charcoal, width: 0.8 });
  // Lectern stem
  lectern.rect(-3, 22, 6, 18).fill({ color: PALETTE.steel700 });
  // Lectern base
  lectern.poly([-12, 38, 12, 38, 14, 44, -14, 44]).fill({ color: PALETTE.steel800 });
  lectern.poly([-12, 38, 12, 38, 14, 44, -14, 44]).stroke({ color: PALETTE.charcoal, width: 0.6 });
  view.addChild(lectern);

  // Open book
  const book = new Graphics();
  // Cover (slight perspective trapezoid)
  book.poly([-w / 2, -8, w / 2, -8, w / 2 + 4, 12, -w / 2 - 4, 12])
    .fill({ color: PALETTE.charcoal })
    .stroke({ color: accent, width: 0.8, alpha: 0.85 });
  // Left page
  book.poly([-w / 2 + 2, -6, -1, -6, -1, 10, -w / 2 + 4, 10])
    .fill({ color: 0xe6e0c5, alpha: 0.95 });
  // Right page
  book.poly([1, -6, w / 2 - 2, -6, w / 2 - 4, 10, 1, 10])
    .fill({ color: 0xe6e0c5, alpha: 0.95 });
  // Spine
  book.rect(-1, -6, 2, 16).fill({ color: PALETTE.steel700 });
  view.addChild(book);

  // Page text lines (static set of dashes — we'll redraw page lines each frame for ink-flow)
  const pageInk = new Graphics();
  view.addChild(pageInk);

  // Halo behind book (additive)
  const halo = new Graphics();
  halo.blendMode = "add";
  halo.filters = [new BlurFilter({ strength: 5, quality: 3 })];
  view.addChildAt(halo, 0);

  // Glyph orbit (rotating Text instances)
  const glyphRing = new Container();
  view.addChild(glyphRing);
  const glyphTexts: Text[] = [];
  const glyphCount = 6;
  const glyphR = w / 2 + 14;
  for (let i = 0; i < glyphCount; i++) {
    const t = new Text({
      text: GLYPHS[i % GLYPHS.length],
      style: new TextStyle({
        fontFamily: "serif",
        fontSize: 8,
        fill: accent,
      }),
    });
    t.anchor.set(0.5, 0.5);
    glyphTexts.push(t);
    glyphRing.addChild(t);
  }

  // Crisp page-turn highlight
  const turn = new Graphics();
  view.addChild(turn);
  let pageFlipPhase = 0;

  const tick = (t: number) => {
    // Halo breathes
    halo.clear();
    const hk = 0.6 + Math.sin(t * 1.2) * 0.25;
    for (let r = w * 0.7; r > 0; r -= 3) {
      const a = (1 - r / (w * 0.7)) * 0.22 * hk;
      halo.ellipse(0, 4, r * 1.2, r * 0.7).fill({ color: accent, alpha: a });
    }
    halo.ellipse(0, 4, w * 0.5, w * 0.18).fill({ color: PALETTE.warningGold, alpha: 0.4 * hk });

    // Page text — bands of small line dashes per page, slow scroll suggests reading
    pageInk.clear();
    const lineCount = 6;
    for (let side = 0; side < 2; side++) {
      const baseX = side === 0 ? -w / 2 + 4 : 3;
      const widthPage = side === 0 ? w / 2 - 6 : w / 2 - 6;
      for (let i = 0; i < lineCount; i++) {
        const ly = -4 + i * 2.2;
        const lw = widthPage * (0.5 + 0.5 * Math.sin(t + i * 0.7 + side * 1.3));
        pageInk.rect(baseX, ly, lw, 0.5).fill({ color: PALETTE.charcoal, alpha: 0.6 });
      }
    }

    // Page-flip every ~3.5s — animate a curved page sweeping across center
    pageFlipPhase = (t % 3.5) / 3.5;
    turn.clear();
    if (pageFlipPhase < 0.35) {
      const k = pageFlipPhase / 0.35;
      const flipX = -w / 2 + 4 + k * (w - 8);
      const top = -7;
      const bot = 11;
      // Curving page — bezier suggesting bend
      turn.moveTo(0, top).bezierCurveTo(
        flipX * 0.6, top - 4,
        flipX * 0.9, bot + 4,
        flipX, bot,
      ).lineTo(flipX, top).closePath().fill({ color: 0xf2eedd, alpha: 0.95 });
      turn.moveTo(0, top).bezierCurveTo(
        flipX * 0.6, top - 4,
        flipX * 0.9, bot + 4,
        flipX, bot,
      ).stroke({ color: PALETTE.steel500, width: 0.4, alpha: 0.7 });
    }

    // Glyphs orbit slowly around codex
    const orbitT = t * 0.4;
    for (let i = 0; i < glyphTexts.length; i++) {
      const a = orbitT + (i / glyphCount) * Math.PI * 2;
      glyphTexts[i].x = Math.cos(a) * glyphR;
      glyphTexts[i].y = Math.sin(a) * glyphR * 0.45 - 4;
      const z = Math.sin(a);
      glyphTexts[i].alpha = 0.35 + (z + 1) * 0.5 * 0.5;
      glyphTexts[i].scale.set(0.8 + (z + 1) * 0.2);
    }
  };
  return { view, tick };
}

// ═══════════════════ LIBRARIAN DESK ═══════════════════
// Parchment + ink well + quill + candle with warm flicker.

export function buildLibrarianDesk(opts: {
  width: number;
  height: number;
  accent?: number;
}): LoreProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.lore;
  const view = new Container();

  // Desk top
  const desk = new Graphics();
  desk.roundRect(0, 0, w, h, 3).fill({ color: PALETTE.steel700 });
  desk.roundRect(0, 0, w, h, 3).stroke({ color: accent, width: 0.8, alpha: 0.7 });
  desk.rect(2, 2, w - 4, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  // Wood grain hint
  for (let i = 0; i < 4; i++) {
    desk.rect(4, 6 + i * 8, w - 8, 0.4).fill({ color: PALETTE.charcoal, alpha: 0.25 });
  }
  view.addChild(desk);

  // Parchment scroll (left side)
  const parch = new Graphics();
  const px = 6;
  const py = 8;
  const pw = w * 0.48;
  const ph = h - 16;
  parch.rect(px, py, pw, ph).fill({ color: 0xece2c0 });
  parch.rect(px, py, pw, ph).stroke({ color: PALETTE.steel500, width: 0.5, alpha: 0.7 });
  // Curl edges (left + right)
  parch.poly([px, py, px + 4, py + 2, px + 4, py + ph - 2, px, py + ph])
    .fill({ color: 0xd8c98f, alpha: 0.85 });
  parch.poly([px + pw, py, px + pw - 4, py + 2, px + pw - 4, py + ph - 2, px + pw, py + ph])
    .fill({ color: 0xd8c98f, alpha: 0.85 });
  // Ink lines (handwritten)
  for (let i = 0; i < 6; i++) {
    const ly = py + 4 + i * 4;
    const lw = pw - 12 - (i % 3) * 4;
    parch.rect(px + 6, ly, lw, 0.6).fill({ color: PALETTE.charcoal, alpha: 0.7 });
  }
  view.addChild(parch);

  // Ink well (right of parchment)
  const inkX = w * 0.6;
  const inkY = h - 16;
  const ink = new Graphics();
  ink.rect(inkX - 4, inkY, 8, 8).fill({ color: PALETTE.steel900 });
  ink.rect(inkX - 4, inkY, 8, 8).stroke({ color: PALETTE.steel400, width: 0.4 });
  ink.rect(inkX - 3, inkY + 1, 6, 6).fill({ color: PALETTE.charcoal });
  ink.circle(inkX, inkY + 4, 1.4).fill({ color: accent });
  view.addChild(ink);

  // Quill stuck in ink well
  const quill = new Graphics();
  quill.moveTo(inkX, inkY + 4).lineTo(inkX + 5, inkY - 16).stroke({ color: PALETTE.steel300, width: 0.7 });
  // Feather
  quill.poly([inkX + 5, inkY - 16, inkX + 9, inkY - 22, inkX + 12, inkY - 14, inkX + 6, inkY - 12])
    .fill({ color: PALETTE.ivory, alpha: 0.85 });
  view.addChild(quill);

  // Candle (right corner)
  const cx = w - 12;
  const cy = h - 14;
  const candle = new Graphics();
  candle.rect(cx - 2, cy - 8, 4, 10).fill({ color: 0xf5e9c2 });
  candle.rect(cx - 2, cy - 8, 4, 1).fill({ color: PALETTE.warningGold, alpha: 0.6 });
  candle.rect(cx - 0.4, cy - 12, 0.8, 4).fill({ color: PALETTE.steel700 });
  // Holder
  candle.rect(cx - 4, cy + 2, 8, 2).fill({ color: PALETTE.steel500 });
  view.addChild(candle);

  // Candle flame (additive flicker)
  const flame = new Graphics();
  flame.blendMode = "add";
  flame.filters = [new BlurFilter({ strength: 3, quality: 2 })];
  view.addChild(flame);

  // Warm pool of light on parchment
  const warmGlow = new Graphics();
  warmGlow.blendMode = "add";
  warmGlow.filters = [new BlurFilter({ strength: 6, quality: 3 })];
  view.addChildAt(warmGlow, 1);

  const tick = (t: number) => {
    flame.clear();
    const fk = 0.85 + Math.sin(t * 9 + Math.sin(t * 17) * 2) * 0.15;
    for (let r = 5; r > 0; r -= 1) {
      const a = (1 - r / 5) * 0.45 * fk;
      flame.ellipse(cx, cy - 14, r * 0.9, r * 1.4).fill({ color: PALETTE.warningGold, alpha: a });
    }
    flame.ellipse(cx, cy - 16, 1.3, 3).fill({ color: PALETTE.scout, alpha: 0.7 * fk });
    flame.ellipse(cx, cy - 17, 0.7, 1.5).fill({ color: PALETTE.ivory, alpha: 0.9 * fk });

    // Warm glow over the desk
    warmGlow.clear();
    for (let r = 28; r > 0; r -= 3) {
      const a = (1 - r / 28) * 0.16 * fk;
      warmGlow.ellipse(cx - 8, cy - 10, r * 1.4, r * 0.7).fill({ color: PALETTE.warningGold, alpha: a });
    }
  };
  return { view, tick };
}

// ═══════════════════ CARD CATALOG ═══════════════════
// Grid of drawer faces with index labels and tiny brass handles.

export function buildCardCatalog(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): LoreProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.lore;
  const cols = opts.cols ?? 4;
  const rows = opts.rows ?? 4;
  const view = new Container();

  // Cabinet frame
  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.steel700 });
  frame.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  frame.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  frame.rect(0, h - 3, w, 3).fill({ color: PALETTE.steel800 });
  view.addChild(frame);

  // Drawers
  const dW = (w - 4) / cols;
  const dH = (h - 8) / rows;
  const drawerG = new Graphics();
  view.addChild(drawerG);
  // Letter labels
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let labelIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = 2 + c * dW;
      const dy = 4 + r * dH;
      drawerG.rect(dx, dy, dW - 1, dH - 1).fill({ color: PALETTE.steel800 });
      drawerG.rect(dx, dy, dW - 1, dH - 1).stroke({ color: PALETTE.charcoal, width: 0.5 });
      drawerG.rect(dx, dy, dW - 1, 0.5).fill({ color: PALETTE.steel500, alpha: 0.7 });
      // Brass handle
      drawerG.rect(dx + dW / 2 - 3, dy + dH - 4, 6, 1.4).fill({ color: PALETTE.warningGold, alpha: 0.85 });
      // Label card insert
      drawerG.rect(dx + 2, dy + 1, dW - 5, 2.4).fill({ color: 0xe6e0c5 });
      // Letter label text per drawer
      const t = new Text({
        text: `${letters[labelIdx % 26]}-${letters[(labelIdx + 1) % 26]}`,
        style: new TextStyle({
          fontFamily: "Consolas, monospace",
          fontSize: 3,
          fill: PALETTE.charcoal,
          letterSpacing: 0.4,
        }),
      });
      t.position.set(dx + 3, dy + 1.2);
      view.addChild(t);
      labelIdx++;
    }
  }

  // Open-drawer animation: one drawer slides out periodically
  const openOverlay = new Graphics();
  view.addChild(openOverlay);

  const tick = (t: number) => {
    openOverlay.clear();
    const cyc = t % 6;
    if (cyc < 2) {
      // pick a drawer to "open" — slide bottom-front shadow forward
      const idx = Math.floor((t / 6) * 13) % (cols * rows);
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const dx = 2 + c * dW;
      const dy = 4 + r * dH;
      const out = Math.min(1, cyc / 0.5) * 4;
      openOverlay.rect(dx, dy + dH - 1, dW - 1, 1 + out).fill({ color: PALETTE.charcoal });
      openOverlay.rect(dx, dy + dH - 1, dW - 1, 1).fill({ color: PALETTE.steel500, alpha: 0.4 });
    }
  };
  return { view, tick };
}

// ═══════════════════ SCROLL TUBE WALL ═══════════════════
// Wall of round tube ends (cubbies) with rolled scrolls visible inside.

export function buildScrollTubeWall(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): LoreProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.lore;
  const cols = opts.cols ?? 4;
  const rows = opts.rows ?? 3;
  const view = new Container();

  // Backplate
  const back = new Graphics();
  back.rect(0, 0, w, h).fill({ color: PALETTE.steel800 });
  back.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  back.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
  view.addChild(back);

  // Cubbies
  const cellW = (w - 4) / cols;
  const cellH = (h - 4) / rows;
  const r = Math.min(cellW, cellH) * 0.4;
  const cubby = new Graphics();
  view.addChild(cubby);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = 2 + cellW * (col + 0.5);
      const cy = 2 + cellH * (row + 0.5);
      // Cubby outer
      cubby.circle(cx, cy, r).fill({ color: PALETTE.charcoal });
      cubby.circle(cx, cy, r).stroke({ color: PALETTE.steel500, width: 0.5 });
      // Scroll visible inside (parchment with center darker)
      cubby.circle(cx, cy, r - 1).fill({ color: 0xe6e0c5 });
      cubby.circle(cx, cy, r - 1.6).stroke({ color: PALETTE.steel400, width: 0.3 });
      // Wax seal occasional
      if ((row * cols + col) % 5 === 0) {
        cubby.circle(cx, cy, 1.2).fill({ color: accent });
      } else {
        cubby.circle(cx, cy, 1.2).fill({ color: PALETTE.steel700 });
      }
    }
  }

  // Subtle glow over the wall (additive)
  const glow = new Graphics();
  glow.blendMode = "add";
  view.addChild(glow);
  const tick = (t: number) => {
    glow.clear();
    const k = 0.5 + Math.sin(t * 1.2) * 0.2;
    glow.rect(2, 2, w - 4, h - 4).fill({ color: accent, alpha: 0.06 * k });
  };
  return { view, tick };
}

// ═══════════════════ ARCHIVE INDEX TICKER ═══════════════════
// Bottom-strip scrolling text of book/scroll titles.

export function buildArchiveIndexTicker(opts: {
  width: number;
  height: number;
  accent?: number;
  text?: string;
  speed?: number;
}): LoreProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.lore;
  const speed = opts.speed ?? 22;
  const text = opts.text ??
    "VOL.247 STELLAR CARTOGRAPHY (1873)   ◆   VOL.391 ALCHEMICAL SYMMETRIES   ◆   VOL.442 LANGUAGES OF DUST   ◆   VOL.504 PROTOCOL OF THE FORGE   ◆   VOL.612 GEOMANTIC INDICES";
  const view = new Container();

  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.charcoal });
  frame.rect(0, 0, w, h).stroke({ color: accent, width: 0.8, alpha: 0.85 });
  frame.rect(0, 0, w, 0.7).fill({ color: accent, alpha: 0.55 });
  frame.rect(0, h - 0.7, w, 0.7).fill({ color: accent, alpha: 0.45 });
  view.addChild(frame);

  // Mask
  const mask = new Graphics();
  mask.rect(2, 2, w - 4, h - 4).fill({ color: 0xffffff });
  view.addChild(mask);

  const scroller = new Container();
  view.addChild(scroller);
  scroller.mask = mask;

  const style = new TextStyle({
    fontFamily: "Consolas, monospace",
    fontSize: 6,
    fill: accent,
    letterSpacing: 1.5,
  });
  const t1 = new Text({ text, style });
  t1.position.set(0, h / 2 - t1.height / 2);
  scroller.addChild(t1);
  const t2 = new Text({ text, style });
  t2.position.set(t1.width + 60, h / 2 - t2.height / 2);
  scroller.addChild(t2);
  const loopW = t1.width + 60;

  const tick = (t: number) => {
    const off = -((t * speed) % loopW);
    t1.x = off;
    t2.x = off + loopW;
  };
  return { view, tick };
}
