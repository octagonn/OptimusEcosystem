import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface Greeble {
  view: Container;
  tick: (t: number) => void;
}

const noop = (_: number) => {};

// ═══════════════════ CRATES / BARRELS / CABLES ═══════════════════

export function buildCrate(opts: { size?: number; accent?: number; label?: string }): Greeble {
  const s = opts.size ?? 22;
  const accent = opts.accent ?? PALETTE.warningGold;
  const view = new Container();

  const g = new Graphics();
  // body
  g.rect(0, 0, s, s).fill({ color: PALETTE.steel700 });
  g.rect(0, 0, s, s).stroke({ color: PALETTE.charcoal, width: 1 });
  // top bevel
  g.rect(0, 0, s, 1).fill({ color: PALETTE.steel500, alpha: 0.9 });
  g.rect(0, 0, 1, s).fill({ color: PALETTE.steel500, alpha: 0.7 });
  // bottom shadow
  g.rect(0, s - 1, s, 1).fill({ color: PALETTE.charcoal });
  // diagonal banding
  g.moveTo(2, 2).lineTo(s - 2, s - 2).stroke({ color: accent, width: 1, alpha: 0.5 });
  g.moveTo(s - 2, 2).lineTo(2, s - 2).stroke({ color: accent, width: 1, alpha: 0.5 });
  // center decal
  g.rect(s / 2 - 4, s / 2 - 3, 8, 6).fill({ color: PALETTE.charcoal });
  g.rect(s / 2 - 4, s / 2 - 3, 8, 6).stroke({ color: accent, width: 0.6, alpha: 0.9 });
  // rivets
  for (const [x, y] of [[2, 2], [s - 2, 2], [2, s - 2], [s - 2, s - 2]]) {
    g.circle(x, y, 0.7).fill({ color: PALETTE.steel300 });
  }
  view.addChild(g);

  if (opts.label) {
    const style = new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 0.5,
    });
    const t = new Text({ text: opts.label, style });
    t.position.set(2, s + 1);
    view.addChild(t);
  }

  return { view, tick: noop };
}

export function buildBarrel(opts: { radius?: number; accent?: number }): Greeble {
  const r = opts.radius ?? 10;
  const accent = opts.accent ?? PALETTE.warningGold;
  const view = new Container();

  const g = new Graphics();
  // body (top-down cylinder)
  g.circle(0, 0, r).fill({ color: PALETTE.steel700 });
  g.circle(0, 0, r).stroke({ color: PALETTE.charcoal, width: 1 });
  g.circle(0, 0, r - 2).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.8 });
  // accent ring
  g.circle(0, 0, r * 0.55).stroke({ color: accent, width: 1.2, alpha: 0.85 });
  // hazard dot cluster
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    g.circle(Math.cos(ang) * (r * 0.3), Math.sin(ang) * (r * 0.3), 0.9)
      .fill({ color: accent });
  }
  // cap rivets
  for (let i = 0; i < 4; i++) {
    const ang = i * Math.PI * 0.5 + Math.PI * 0.25;
    g.circle(Math.cos(ang) * (r - 2), Math.sin(ang) * (r - 2), 0.6)
      .fill({ color: PALETTE.steel300 });
  }
  view.addChild(g);
  return { view, tick: noop };
}

export function buildCableTray(opts: {
  length: number;
  axis: "horizontal" | "vertical";
  accent?: number;
  count?: number;
}): Greeble {
  const L = opts.length;
  const n = opts.count ?? 4;
  const accent = opts.accent ?? PALETTE.hologramTeal;
  const view = new Container();

  const g = new Graphics();
  const thick = n + 4;
  if (opts.axis === "horizontal") {
    // tray base
    g.rect(0, 0, L, thick).fill({ color: PALETTE.steel900 });
    g.rect(0, 0, L, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
    g.rect(0, thick - 1, L, 1).fill({ color: PALETTE.charcoal });
    // cables
    for (let i = 0; i < n; i++) {
      const yy = 2 + i;
      const col = i === 0 ? accent : i === 1 ? PALETTE.warn : i === 2 ? PALETTE.steel300 : PALETTE.forge;
      g.rect(0, yy, L, 0.8).fill({ color: col, alpha: 0.75 });
    }
    // support brackets every 40px
    for (let x = 0; x < L; x += 40) {
      g.rect(x, -1, 1.5, thick + 2).fill({ color: PALETTE.steel400 });
    }
  } else {
    g.rect(0, 0, thick, L).fill({ color: PALETTE.steel900 });
    g.rect(0, 0, 1, L).fill({ color: PALETTE.steel500, alpha: 0.6 });
    g.rect(thick - 1, 0, 1, L).fill({ color: PALETTE.charcoal });
    for (let i = 0; i < n; i++) {
      const xx = 2 + i;
      const col = i === 0 ? accent : i === 1 ? PALETTE.warn : i === 2 ? PALETTE.steel300 : PALETTE.forge;
      g.rect(xx, 0, 0.8, L).fill({ color: col, alpha: 0.75 });
    }
    for (let y = 0; y < L; y += 40) {
      g.rect(-1, y, thick + 2, 1.5).fill({ color: PALETTE.steel400 });
    }
  }
  view.addChild(g);

  // Flow pulse (additive)
  const pulse = new Graphics();
  pulse.blendMode = "add";
  view.addChild(pulse);
  const tick = (t: number) => {
    pulse.clear();
    if (opts.axis === "horizontal") {
      const x = (t * 40) % (L + 20) - 10;
      pulse.rect(x, 1, 10, thick - 2).fill({ color: accent, alpha: 0.4 });
    } else {
      const y = (t * 40) % (L + 20) - 10;
      pulse.rect(1, y, thick - 2, 10).fill({ color: accent, alpha: 0.4 });
    }
  };

  return { view, tick };
}

// ═══════════════════ CEILING VENTS / LAMPS ═══════════════════

export function buildCeilingVent(opts: {
  width: number;
  height: number;
  accent?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.steel200;
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  g.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  // frame bevel
  g.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel400, alpha: 0.8 });
  // louvers
  const slats = Math.floor((h - 4) / 3);
  for (let i = 0; i < slats; i++) {
    const y = 3 + i * 3;
    g.rect(3, y, w - 6, 1).fill({ color: PALETTE.steel600 });
    g.rect(3, y + 1, w - 6, 0.5).fill({ color: PALETTE.charcoal });
  }
  // corner screws
  for (const [x, y] of [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]]) {
    g.circle(x, y, 0.9).fill({ color: PALETTE.steel300 });
    g.moveTo(x - 0.6, y).lineTo(x + 0.6, y).stroke({ color: PALETTE.charcoal, width: 0.4 });
  }
  view.addChild(g);

  // subtle indicator LED pulsing
  const led = new Graphics();
  view.addChild(led);
  const tick = (t: number) => {
    led.clear();
    const a = 0.5 + Math.sin(t * 2) * 0.4;
    led.circle(w - 4, h - 4, 0.9).fill({ color: accent, alpha: a });
  };
  return { view, tick };
}

export function buildFloodLight(opts: { width?: number; accent?: number }): Greeble {
  const w = opts.width ?? 22;
  const accent = opts.accent ?? PALETTE.warningGold;
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, 4).fill({ color: PALETTE.steel800 });
  g.rect(0, 0, w, 4).stroke({ color: PALETTE.charcoal, width: 0.6 });
  g.rect(1, 1, w - 2, 1.5).fill({ color: accent, alpha: 0.95 });
  view.addChild(g);

  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 5, quality: 3 })];
  view.addChild(glow);
  const tick = (t: number) => {
    glow.clear();
    const k = 0.7 + Math.sin(t * 2.4) * 0.25;
    for (let rr = 16; rr > 0; rr -= 2) {
      const a = (1 - rr / 16) * 0.22 * k;
      glow.ellipse(w / 2, 2, rr * 1.2, rr * 0.5).fill({ color: accent, alpha: a });
    }
  };
  return { view, tick };
}

// ═══════════════════ FLOOR DECALS ═══════════════════

export function buildHazardStrip(opts: {
  width: number;
  height: number;
  angle?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const view = new Container();

  const mask = new Graphics();
  mask.rect(0, 0, w, h).fill({ color: 0xffffff });
  view.addChild(mask);
  view.mask = mask;

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.charcoal });
  const stripeW = 8;
  for (let x = -h; x < w + h; x += stripeW * 2) {
    g.poly([x, 0, x + stripeW, 0, x + stripeW + h, h, x + h, h]).fill({
      color: PALETTE.warningGold,
      alpha: 0.85,
    });
  }
  view.addChild(g);
  if (opts.angle) view.rotation = opts.angle;
  return { view, tick: noop };
}

export function buildWarningTriangle(opts: { size?: number }): Greeble {
  const s = opts.size ?? 22;
  const view = new Container();

  const g = new Graphics();
  g.poly([s / 2, 2, s - 2, s - 2, 2, s - 2])
    .fill({ color: PALETTE.warningGold, alpha: 0.9 })
    .stroke({ color: PALETTE.charcoal, width: 1.4 });
  g.poly([s / 2, 6, s - 6, s - 4, 6, s - 4])
    .stroke({ color: PALETTE.charcoal, width: 1 });
  g.rect(s / 2 - 0.8, s * 0.35, 1.6, s * 0.3).fill({ color: PALETTE.charcoal });
  g.circle(s / 2, s * 0.75, 1).fill({ color: PALETTE.charcoal });
  view.addChild(g);
  return { view, tick: noop };
}

export function buildFloorNumber(opts: { text: string; accent?: number }): Greeble {
  const accent = opts.accent ?? PALETTE.steel300;
  const view = new Container();
  const style = new TextStyle({
    fontFamily: "Consolas, monospace",
    fontSize: 28,
    fontWeight: "900",
    fill: accent,
    letterSpacing: 2,
  });
  const t = new Text({ text: opts.text, style });
  t.alpha = 0.22;
  view.addChild(t);
  return { view, tick: noop };
}

export function buildGratingPanel(opts: { width: number; height: number }): Greeble {
  const w = opts.width;
  const h = opts.height;
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  g.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 0.8 });
  // grating slots
  for (let y = 2; y < h - 2; y += 3) {
    g.rect(2, y, w - 4, 1).fill({ color: PALETTE.charcoal });
    g.rect(2, y + 1, w - 4, 0.5).fill({ color: PALETTE.steel500, alpha: 0.35 });
  }
  // bolts
  for (const [x, y] of [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]]) {
    g.circle(x, y, 0.9).fill({ color: PALETTE.steel300 });
  }
  view.addChild(g);
  return { view, tick: noop };
}

// ═══════════════════ SERVER RACK / WALL PANEL ═══════════════════

export function buildServerRack(opts: {
  width: number;
  height: number;
  accent?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  frame.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  frame.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
  view.addChild(frame);

  const units = Math.max(3, Math.floor((h - 6) / 6));
  const slot = (h - 6) / units;
  const leds: { g: Graphics; x: number; y: number; phase: number }[] = [];
  const slotG = new Graphics();
  for (let i = 0; i < units; i++) {
    const y = 3 + i * slot;
    slotG.rect(3, y, w - 6, slot - 1).fill({ color: PALETTE.steel800 });
    slotG.rect(3, y, w - 6, slot - 1).stroke({ color: PALETTE.charcoal, width: 0.5 });
    // slot face: LED cluster left, vent grille right
    for (let k = 0; k < 5; k++) {
      slotG.rect(w - 6 - 2 - k * 2, y + 1, 1, slot - 3).fill({ color: PALETTE.steel700 });
    }
    // screws
    slotG.circle(4.5, y + slot / 2 - 0.5, 0.5).fill({ color: PALETTE.steel400 });
    slotG.circle(w - 4.5, y + slot / 2 - 0.5, 0.5).fill({ color: PALETTE.steel400 });
  }
  view.addChild(slotG);

  const ledLayer = new Graphics();
  view.addChild(ledLayer);
  // seed led positions
  for (let i = 0; i < units; i++) {
    const y = 3 + i * slot;
    for (let k = 0; k < 3; k++) {
      leds.push({ g: ledLayer, x: 6 + k * 2.5, y: y + slot / 2 - 0.5, phase: Math.random() * Math.PI * 2 });
    }
  }

  const tick = (t: number) => {
    ledLayer.clear();
    for (const L of leds) {
      const on = (Math.sin(t * 3 + L.phase) + 1) * 0.5;
      const col = on > 0.7 ? accent : on > 0.4 ? PALETTE.ok : PALETTE.warn;
      ledLayer.circle(L.x, L.y, 0.8).fill({ color: col, alpha: 0.55 + on * 0.45 });
    }
  };

  return { view, tick };
}

export function buildWallPanel(opts: {
  width: number;
  height: number;
  accent?: number;
  readout?: "dots" | "bars" | "none";
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.steel300;
  const readout = opts.readout ?? "dots";
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.steel800 });
  g.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  g.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.5 });
  // screws
  for (const [x, y] of [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]]) {
    g.circle(x, y, 0.9).fill({ color: PALETTE.steel300 });
    g.moveTo(x - 0.7, y).lineTo(x + 0.7, y).stroke({ color: PALETTE.charcoal, width: 0.4 });
  }
  view.addChild(g);

  const dynamic = new Graphics();
  view.addChild(dynamic);

  const tick = (t: number) => {
    dynamic.clear();
    if (readout === "dots") {
      const cols = Math.floor((w - 6) / 3);
      const rows = Math.floor((h - 6) / 3);
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const k = Math.sin(t * 2 + cx * 0.6 + cy * 0.8);
          if (k > 0.3) {
            dynamic.circle(3 + cx * 3 + 1, 3 + cy * 3 + 1, 0.7)
              .fill({ color: accent, alpha: 0.35 + k * 0.45 });
          }
        }
      }
    } else if (readout === "bars") {
      const bars = Math.floor((w - 6) / 4);
      for (let i = 0; i < bars; i++) {
        const bh = (Math.sin(t * 1.5 + i * 0.7) + 1) * 0.5 * (h - 8) + 2;
        dynamic.rect(3 + i * 4, h - 3 - bh, 3, bh).fill({ color: accent, alpha: 0.55 });
      }
    }
  };
  return { view, tick };
}

// ═══════════════════ TOOL RACK ═══════════════════

export function buildToolRack(opts: {
  width: number;
  height: number;
  accent?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.forge;
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  g.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 0.8 });
  // peg board dots
  for (let x = 3; x < w - 2; x += 3) {
    for (let y = 3; y < h - 2; y += 3) {
      g.circle(x, y, 0.3).fill({ color: PALETTE.steel500, alpha: 0.55 });
    }
  }
  // hanging tools
  const slots = Math.max(2, Math.floor(w / 10));
  for (let i = 0; i < slots; i++) {
    const cx = (w / slots) * (i + 0.5);
    const kind = i % 3;
    if (kind === 0) {
      // wrench
      g.rect(cx - 1, 3, 2, h - 8).fill({ color: PALETTE.steel400 });
      g.circle(cx, 3, 2).fill({ color: PALETTE.steel400 });
      g.circle(cx, h - 5, 2).fill({ color: PALETTE.steel400 });
      g.circle(cx, h - 5, 1).fill({ color: PALETTE.charcoal });
    } else if (kind === 1) {
      // hammer
      g.rect(cx - 0.8, 5, 1.6, h - 10).fill({ color: PALETTE.steel400 });
      g.rect(cx - 3, 3, 6, 3).fill({ color: PALETTE.steel300 });
      g.rect(cx - 3, 3, 6, 1).fill({ color: PALETTE.steel100, alpha: 0.6 });
    } else {
      // screwdriver
      g.rect(cx - 0.8, 3, 1.6, h - 6).fill({ color: accent, alpha: 0.9 });
      g.rect(cx - 0.4, h - 4, 0.8, 3).fill({ color: PALETTE.steel200 });
    }
  }
  view.addChild(g);
  return { view, tick: noop };
}

// ═══════════════════ MONITOR WALL ═══════════════════

export function buildMonitorWall(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.hologramTeal;
  const cols = opts.cols ?? 3;
  const rows = opts.rows ?? 2;
  const view = new Container();

  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  frame.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  view.addChild(frame);

  const cellW = (w - 2) / cols;
  const cellH = (h - 2) / rows;
  const animated: { cx: number; cy: number; w: number; h: number; kind: number }[] = [];
  const screens = new Graphics();
  view.addChild(screens);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = 1 + c * cellW + 1;
      const cy = 1 + r * cellH + 1;
      const cw = cellW - 2;
      const ch = cellH - 2;
      frame.rect(cx, cy, cw, ch).fill({ color: PALETTE.charcoal });
      frame.rect(cx, cy, cw, ch).stroke({ color: PALETTE.steel500, width: 0.5, alpha: 0.8 });
      animated.push({ cx, cy, w: cw, h: ch, kind: (r * cols + c) % 4 });
    }
  }

  // glow behind
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 4, quality: 3 })];
  view.addChildAt(glow, 1);

  const tick = (t: number) => {
    screens.clear();
    glow.clear();
    glow.rect(1, 1, w - 2, h - 2).fill({ color: accent, alpha: 0.1 });

    for (const m of animated) {
      const { cx, cy, w: mw, h: mh, kind } = m;
      glow.rect(cx, cy, mw, mh).fill({ color: accent, alpha: 0.12 });
      if (kind === 0) {
        // wave
        for (let i = 0; i < mw; i += 1) {
          const y = cy + mh / 2 + Math.sin((i + t * 30) * 0.2) * (mh * 0.28);
          screens.rect(cx + i, y, 1, 1).fill({ color: accent, alpha: 0.85 });
        }
      } else if (kind === 1) {
        // bars
        const bars = Math.max(3, Math.floor(mw / 3));
        for (let i = 0; i < bars; i++) {
          const bh = (Math.sin(t * 1.2 + i * 0.6) + 1) * 0.5 * (mh - 2) + 1;
          screens.rect(cx + 1 + i * 3, cy + mh - bh, 2, bh).fill({ color: accent, alpha: 0.7 });
        }
      } else if (kind === 2) {
        // grid + scan
        for (let i = 0; i < mw; i += 3) screens.rect(cx + i, cy, 0.5, mh).fill({ color: accent, alpha: 0.18 });
        for (let j = 0; j < mh; j += 3) screens.rect(cx, cy + j, mw, 0.5).fill({ color: accent, alpha: 0.18 });
        const sx = cx + ((t * 20) % mw);
        screens.rect(sx, cy, 0.8, mh).fill({ color: accent, alpha: 0.9 });
      } else {
        // map dots
        for (let k = 0; k < 8; k++) {
          const ang = k + t * 0.3;
          const px = cx + mw / 2 + Math.cos(ang) * (mw * 0.3);
          const py = cy + mh / 2 + Math.sin(ang * 1.3) * (mh * 0.3);
          screens.circle(px, py, 0.8).fill({ color: accent, alpha: 0.8 });
        }
      }
    }
  };

  return { view, tick };
}

// ═══════════════════ TACTICAL MAP ═══════════════════

export function buildTacticalMap(opts: {
  width: number;
  height: number;
  accent?: number;
}): Greeble {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.prime;
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  g.rect(0, 0, w, h).stroke({ color: accent, width: 1, alpha: 0.8 });
  g.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.5 });
  // grid
  for (let x = 6; x < w; x += 6) g.moveTo(x, 2).lineTo(x, h - 2).stroke({ color: accent, width: 0.3, alpha: 0.25 });
  for (let y = 6; y < h; y += 6) g.moveTo(2, y).lineTo(w - 2, y).stroke({ color: accent, width: 0.3, alpha: 0.25 });
  // coastline-ish curves
  g.moveTo(4, h * 0.7)
    .bezierCurveTo(w * 0.25, h * 0.3, w * 0.5, h * 0.85, w - 4, h * 0.45)
    .stroke({ color: accent, width: 0.7, alpha: 0.55 });
  g.moveTo(w * 0.15, 4)
    .bezierCurveTo(w * 0.4, h * 0.25, w * 0.6, h * 0.1, w - 4, h * 0.35)
    .stroke({ color: accent, width: 0.5, alpha: 0.4 });
  view.addChild(g);

  // moving dot markers (targets)
  const markers = new Graphics();
  view.addChild(markers);
  const seeds = Array.from({ length: 5 }, (_, i) => ({
    x: w * (0.2 + i * 0.15),
    y: h * (0.3 + (i % 2) * 0.4),
    phase: i * 0.7,
  }));

  const tick = (t: number) => {
    markers.clear();
    for (const s of seeds) {
      const pulse = (Math.sin(t * 2 + s.phase) + 1) * 0.5;
      markers.circle(s.x, s.y, 1.4).fill({ color: accent });
      markers.circle(s.x, s.y, 1.4 + pulse * 3).stroke({ color: accent, width: 0.6, alpha: 1 - pulse });
    }
    // crosshair cursor
    const cx = w / 2 + Math.sin(t * 0.4) * (w * 0.15);
    const cy = h / 2 + Math.cos(t * 0.3) * (h * 0.2);
    markers.moveTo(cx - 5, cy).lineTo(cx + 5, cy).stroke({ color: PALETTE.warningGold, width: 0.6 });
    markers.moveTo(cx, cy - 5).lineTo(cx, cy + 5).stroke({ color: PALETTE.warningGold, width: 0.6 });
    markers.circle(cx, cy, 2).stroke({ color: PALETTE.warningGold, width: 0.6 });
  };
  return { view, tick };
}

// ═══════════════════ CHAIR / DESK ═══════════════════

export function buildChair(opts: { accent?: number; facing?: "n" | "s" | "e" | "w" }): Greeble {
  const accent = opts.accent ?? PALETTE.steel400;
  const facing = opts.facing ?? "n";
  const view = new Container();
  const g = new Graphics();
  // seat (top-down square)
  g.rect(-7, -7, 14, 14).fill({ color: PALETTE.steel700 });
  g.rect(-7, -7, 14, 14).stroke({ color: PALETTE.charcoal, width: 0.8 });
  g.rect(-5, -5, 10, 10).fill({ color: PALETTE.steel600 });
  g.circle(0, 0, 2).fill({ color: accent, alpha: 0.8 });
  // backrest
  const thick = 3;
  if (facing === "n") g.rect(-7, -10, 14, thick).fill({ color: PALETTE.steel500 });
  if (facing === "s") g.rect(-7, 7, 14, thick).fill({ color: PALETTE.steel500 });
  if (facing === "w") g.rect(-10, -7, thick, 14).fill({ color: PALETTE.steel500 });
  if (facing === "e") g.rect(7, -7, thick, 14).fill({ color: PALETTE.steel500 });
  view.addChild(g);
  return { view, tick: noop };
}

// ═══════════════════ BEACON / SCANNER ═══════════════════

export function buildBeacon(opts: { radius?: number; accent?: number }): Greeble {
  const r = opts.radius ?? 6;
  const accent = opts.accent ?? PALETTE.warningGold;
  const view = new Container();
  const base = new Graphics();
  base.circle(0, 0, r).fill({ color: PALETTE.steel800 });
  base.circle(0, 0, r).stroke({ color: PALETTE.charcoal, width: 0.6 });
  base.circle(0, 0, r - 1.5).fill({ color: PALETTE.steel900 });
  view.addChild(base);

  const light = new Graphics();
  light.blendMode = "add";
  light.filters = [new BlurFilter({ strength: 3, quality: 3 })];
  view.addChild(light);

  const core = new Graphics();
  view.addChild(core);

  const tick = (t: number) => {
    const pulse = (Math.sin(t * 3.3) + 1) * 0.5;
    core.clear();
    core.circle(0, 0, r - 2.5).fill({ color: accent, alpha: 0.7 + pulse * 0.3 });
    light.clear();
    for (let rr = r + 4; rr > 0; rr -= 2) {
      const a = (1 - rr / (r + 4)) * 0.25 * (0.6 + pulse * 0.4);
      light.circle(0, 0, rr).fill({ color: accent, alpha: a });
    }
  };
  return { view, tick };
}

// ═══════════════════ LABEL TAG ═══════════════════

export function buildLabelTag(opts: { text: string; accent?: number }): Greeble {
  const accent = opts.accent ?? PALETTE.steel200;
  const view = new Container();
  const style = new TextStyle({
    fontFamily: "Consolas, monospace",
    fontSize: 6,
    fill: accent,
    letterSpacing: 1,
  });
  const t = new Text({ text: opts.text.toUpperCase(), style });
  const pad = 3;
  const bg = new Graphics();
  bg.rect(0, 0, t.width + pad * 2, t.height + pad).fill({ color: PALETTE.charcoal, alpha: 0.85 });
  bg.rect(0, 0, t.width + pad * 2, t.height + pad).stroke({ color: accent, width: 0.5, alpha: 0.8 });
  view.addChild(bg);
  t.position.set(pad, pad * 0.5);
  view.addChild(t);
  return { view, tick: noop };
}
