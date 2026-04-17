import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface NovaProp {
  view: Container;
  tick: (t: number) => void;
}

const noop = (_: number) => {};

// ═══════════════════ PLASMA CONTAINMENT CORE ═══════════════════
// Center vessel + 3 rotating mag-field rings + pulsing plasma blob.

export function buildPlasmaCore(opts: {
  radius?: number;
  accent?: number;
}): NovaProp {
  const r = opts.radius ?? 42;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  // Outer pedestal
  const pedestal = new Graphics();
  pedestal.rect(-r * 0.7, r - 4, r * 1.4, 8).fill({ color: PALETTE.steel800 });
  pedestal.rect(-r * 0.7, r - 4, r * 1.4, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  pedestal.rect(-r * 0.7, r + 3, r * 1.4, 1).fill({ color: PALETTE.charcoal });
  pedestal.rect(-r * 0.5, r + 4, r, 4).fill({ color: PALETTE.steel700 });
  view.addChild(pedestal);

  // Vessel — vertical cylinder suggestion (top + bottom rings)
  const vessel = new Graphics();
  vessel.ellipse(0, -r, r * 0.7, 6).fill({ color: PALETTE.steel700 });
  vessel.ellipse(0, -r, r * 0.7, 6).stroke({ color: PALETTE.charcoal, width: 0.8 });
  vessel.ellipse(0, r - 4, r * 0.7, 6).fill({ color: PALETTE.steel700 });
  vessel.ellipse(0, r - 4, r * 0.7, 6).stroke({ color: PALETTE.charcoal, width: 0.8 });
  // Glass tube outline
  vessel.moveTo(-r * 0.7, -r).lineTo(-r * 0.7, r - 4)
    .stroke({ color: PALETTE.steel400, width: 0.8, alpha: 0.85 });
  vessel.moveTo(r * 0.7, -r).lineTo(r * 0.7, r - 4)
    .stroke({ color: PALETTE.steel400, width: 0.8, alpha: 0.85 });
  view.addChild(vessel);

  // Plasma glow (additive, blurred)
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 6, quality: 3 })];
  view.addChild(glow);

  // Mag-field rings (3 ellipses rotating at different speeds — fake by
  // squashing rectangles). We use Graphics rotation containers.
  const ring1 = new Container();
  const ring2 = new Container();
  const ring3 = new Container();
  view.addChild(ring1);
  view.addChild(ring2);
  view.addChild(ring3);
  const r1g = new Graphics();
  ring1.addChild(r1g);
  const r2g = new Graphics();
  ring2.addChild(r2g);
  const r3g = new Graphics();
  ring3.addChild(r3g);

  const drawMagRing = (g: Graphics, rr: number, color: number) => {
    g.clear();
    g.ellipse(0, 0, rr, rr * 0.32).stroke({ color, width: 1.4, alpha: 0.85 });
    g.ellipse(0, 0, rr, rr * 0.32).stroke({ color, width: 3, alpha: 0.18 });
    // tick marks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tx = Math.cos(a) * rr;
      const ty = Math.sin(a) * rr * 0.32;
      g.circle(tx, ty, 1).fill({ color, alpha: 0.9 });
    }
  };
  drawMagRing(r1g, r * 0.85, accent);
  drawMagRing(r2g, r * 0.7, PALETTE.hologramTeal);
  drawMagRing(r3g, r * 0.55, PALETTE.scout);

  // Falling spark pool (containment leak feel)
  const sparkLayer = new Graphics();
  sparkLayer.blendMode = "add";
  view.addChild(sparkLayer);
  type Spark = { x: number; y: number; vy: number; life: number; max: number };
  const sparks: Spark[] = Array.from({ length: 14 }, () => ({
    x: 0, y: 0, vy: 0, life: 0, max: 1,
  }));
  let spawnClock = 0;
  let tLast = 0;

  // Crisp plasma core
  const core = new Graphics();
  view.addChild(core);

  const tick = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, t - tLast));
    tLast = t;

    // Glow
    glow.clear();
    const k = 0.7 + Math.sin(t * 2.5) * 0.25 + Math.sin(t * 7) * 0.1;
    for (let rr = r; rr > 0; rr -= 3) {
      const a = (1 - rr / r) * 0.34 * k;
      glow.circle(0, 0, rr).fill({ color: accent, alpha: a });
    }
    glow.circle(0, 0, r * 0.4).fill({ color: PALETTE.hologramTeal, alpha: 0.6 * k });

    // Mag rings rotate (around X-axis — vertical tilt). Animate via container.rotation.
    // For tilt-style: also translate y to fake parallax; using container.rotation gives
    // a 2D ring spin which is the cheaper, readable choice.
    ring1.rotation = t * 0.7;
    ring2.rotation = -t * 1.2;
    ring3.rotation = t * 1.8;

    // Plasma core pulse
    core.clear();
    const cr = r * 0.18 + Math.sin(t * 5) * 2;
    core.circle(0, 0, cr).fill({ color: PALETTE.ivory, alpha: 0.95 });
    core.circle(0, 0, cr * 1.6).fill({ color: PALETTE.hologramTeal, alpha: 0.5 });
    // Lightning arc to vessel walls (occasional)
    if (Math.sin(t * 3) > 0.6) {
      const ang = Math.random() * Math.PI * 2;
      const tx = Math.cos(ang) * (r * 0.6);
      const ty = Math.sin(ang) * (r * 0.6);
      core.moveTo(0, 0)
        .lineTo(tx * 0.5 + (Math.random() - 0.5) * 4, ty * 0.5 + (Math.random() - 0.5) * 4)
        .lineTo(tx, ty)
        .stroke({ color: PALETTE.hologramTeal, width: 0.8, alpha: 0.85 });
    }

    // Sparks rising/falling around vessel
    spawnClock += dt;
    while (spawnClock > 0.18) {
      spawnClock -= 0.18;
      const s = sparks.find((sp) => sp.life <= 0);
      if (s) {
        s.x = (Math.random() - 0.5) * r * 1.4;
        s.y = -r + Math.random() * r * 2;
        s.vy = -16 - Math.random() * 12;
        s.max = 0.7 + Math.random() * 0.5;
        s.life = s.max;
      }
    }
    sparkLayer.clear();
    for (const s of sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.y += s.vy * dt;
      const a = Math.max(0, s.life / s.max);
      sparkLayer.circle(s.x, s.y, 0.7).fill({ color: accent, alpha: a });
    }
  };

  return { view, tick };
}

// ═══════════════════ DNA HELIX HOLO ═══════════════════
// Two sine-wave strands with rung crossbars. Drift over time.

export function buildDnaHelix(opts: {
  width: number;
  height: number;
  accent?: number;
}): NovaProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  // Frame
  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.charcoal });
  frame.rect(0, 0, w, h).stroke({ color: accent, width: 0.8, alpha: 0.85 });
  frame.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.5 });
  view.addChild(frame);

  // Title bar
  const title = new Text({
    text: "GENOMIC // 1.4Gbp",
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 1,
    }),
  });
  title.position.set(3, 2);
  view.addChild(title);

  // Helix layer (additive)
  const helixGlow = new Graphics();
  helixGlow.blendMode = "add";
  helixGlow.filters = [new BlurFilter({ strength: 1.5, quality: 2 })];
  view.addChild(helixGlow);
  const helix = new Graphics();
  view.addChild(helix);

  const tick = (t: number) => {
    helix.clear();
    helixGlow.clear();
    const cy = h / 2 + 2;
    const startX = 6;
    const endX = w - 6;
    const amp = (h - 16) * 0.35;
    const freq = 0.18;
    const phase = t * 1.4;
    // Two strands
    let prevAY = 0;
    let prevBY = 0;
    let prevX = startX;
    for (let x = startX; x <= endX; x += 1) {
      const ay = cy + Math.sin(x * freq + phase) * amp;
      const by = cy + Math.sin(x * freq + phase + Math.PI) * amp;
      if (x > startX) {
        helix.moveTo(prevX, prevAY).lineTo(x, ay).stroke({ color: accent, width: 0.7, alpha: 0.95 });
        helix.moveTo(prevX, prevBY).lineTo(x, by).stroke({ color: PALETTE.hologramTeal, width: 0.7, alpha: 0.85 });
      }
      prevAY = ay;
      prevBY = by;
      prevX = x;
    }
    // Crossbar rungs every ~16px
    for (let x = startX + 4; x <= endX; x += 6) {
      const ay = cy + Math.sin(x * freq + phase) * amp;
      const by = cy + Math.sin(x * freq + phase + Math.PI) * amp;
      const rungAlpha = Math.abs(ay - by) / (amp * 2);
      helix.moveTo(x, ay).lineTo(x, by).stroke({
        color: PALETTE.scout,
        width: 0.5,
        alpha: 0.4 + rungAlpha * 0.4,
      });
    }
    // Soft glow trail
    helixGlow.rect(2, cy - amp - 2, w - 4, amp * 2 + 4).fill({ color: accent, alpha: 0.06 });
  };

  return { view, tick };
}

// ═══════════════════ CENTRIFUGE ═══════════════════
// Top-down centrifuge rotor with 6 sample tubes, fast spin.

export function buildCentrifuge(opts: {
  radius?: number;
  accent?: number;
}): NovaProp {
  const r = opts.radius ?? 22;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  // Housing
  const housing = new Graphics();
  housing.rect(-r - 4, -r - 4, (r + 4) * 2, (r + 4) * 2 + 4).fill({ color: PALETTE.steel800 });
  housing.rect(-r - 4, -r - 4, (r + 4) * 2, (r + 4) * 2 + 4)
    .stroke({ color: PALETTE.charcoal, width: 0.8 });
  housing.circle(0, 0, r + 2).fill({ color: PALETTE.steel900 });
  housing.circle(0, 0, r + 2).stroke({ color: accent, width: 0.6, alpha: 0.6 });
  // Lid hinges
  housing.rect(-r - 1, -r - 5, 4, 2).fill({ color: PALETTE.steel500 });
  housing.rect(r - 3, -r - 5, 4, 2).fill({ color: PALETTE.steel500 });
  view.addChild(housing);

  // Spinning rotor container
  const rotor = new Container();
  view.addChild(rotor);
  const r1 = new Graphics();
  rotor.addChild(r1);
  // Rotor arms with sample tubes
  const tubeColors = [PALETTE.lore, PALETTE.warningGold, PALETTE.prime, PALETTE.scout, PALETTE.warn, PALETTE.hologramTeal];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cx = Math.cos(a) * (r - 4);
    const cy = Math.sin(a) * (r - 4);
    // Arm
    r1.moveTo(0, 0).lineTo(cx, cy).stroke({ color: PALETTE.steel400, width: 1.4 });
    // Tube
    r1.circle(cx, cy, 2.5).fill({ color: PALETTE.steel900 });
    r1.circle(cx, cy, 2.5).stroke({ color: PALETTE.steel400, width: 0.4 });
    r1.circle(cx, cy, 1.5).fill({ color: tubeColors[i], alpha: 0.85 });
  }
  // Hub
  r1.circle(0, 0, 2.4).fill({ color: PALETTE.steel500 });
  r1.circle(0, 0, 1).fill({ color: accent });

  // Status LED + RPM readout
  const dyn = new Graphics();
  view.addChild(dyn);
  const rpm = new Text({
    text: "12000 RPM",
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 0.5,
    }),
  });
  rpm.position.set(-rpm.width / 2, r + 4);
  view.addChild(rpm);

  const tick = (t: number) => {
    rotor.rotation = t * 18; // very fast
    dyn.clear();
    const on = (Math.sin(t * 5) + 1) * 0.5 > 0.5;
    dyn.circle(r - 2, -r - 2, 1).fill({
      color: on ? PALETTE.ok : PALETTE.steel500,
      alpha: on ? 1 : 0.6,
    });
  };
  return { view, tick };
}

// ═══════════════════ LAB BENCH ═══════════════════
// Bench with beakers, bubbling fluids, Bunsen burner with flame.

export function buildLabBench(opts: {
  width: number;
  height: number;
  accent?: number;
}): NovaProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  // Bench top
  const bench = new Graphics();
  bench.rect(0, h - 14, w, 14).fill({ color: PALETTE.steel800 });
  bench.rect(0, h - 14, w, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  bench.rect(0, h - 14, w, 14).stroke({ color: PALETTE.charcoal, width: 0.6 });
  // Drawer rivets
  for (let x = 8; x < w; x += 16) {
    bench.circle(x, h - 7, 0.5).fill({ color: PALETTE.steel400 });
  }
  view.addChild(bench);

  // Bunsen burner (left)
  const bun = new Graphics();
  const bx = 14;
  const by = h - 14;
  bun.rect(bx - 2, by - 12, 4, 12).fill({ color: PALETTE.steel500 });
  bun.rect(bx - 4, by - 2, 8, 2).fill({ color: PALETTE.steel700 });
  bun.rect(bx - 1, by - 14, 2, 2).fill({ color: PALETTE.steel400 });
  view.addChild(bun);

  // Flame (additive flicker)
  const flame = new Graphics();
  flame.blendMode = "add";
  flame.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(flame);

  // Beakers along bench
  type Beaker = { x: number; baseW: number; baseH: number; color: number; phase: number };
  const beakers: Beaker[] = [
    { x: 32, baseW: 10, baseH: 18, color: accent, phase: 0 },
    { x: 50, baseW: 8, baseH: 14, color: PALETTE.lore, phase: 1.1 },
    { x: 64, baseW: 12, baseH: 22, color: PALETTE.hologramTeal, phase: 2.0 },
    { x: 84, baseW: 9, baseH: 16, color: PALETTE.warningGold, phase: 0.6 },
  ];
  const beakerStatic = new Graphics();
  view.addChild(beakerStatic);
  for (const b of beakers) {
    const bx2 = b.x;
    const by2 = h - 14 - b.baseH;
    // Vessel body
    beakerStatic.rect(bx2, by2, b.baseW, b.baseH).fill({ color: PALETTE.steel900 });
    beakerStatic.rect(bx2, by2, b.baseW, b.baseH)
      .stroke({ color: PALETTE.steel400, width: 0.5 });
    // Lip
    beakerStatic.rect(bx2 - 1, by2, b.baseW + 2, 1).fill({ color: PALETTE.steel400 });
  }

  // Dynamic: fluid level + bubbles
  const dyn = new Graphics();
  view.addChild(dyn);

  const tick = (t: number) => {
    flame.clear();
    // Flame body
    const fk = 0.8 + Math.sin(t * 9) * 0.15;
    for (let r = 6; r > 0; r -= 1) {
      const a = (1 - r / 6) * 0.4 * fk;
      flame.ellipse(bx, by - 14 - r * 0.8, r * 0.8, r * 1.4)
        .fill({ color: PALETTE.warningGold, alpha: a });
    }
    flame.ellipse(bx, by - 16, 1.5, 4).fill({ color: PALETTE.scout, alpha: 0.85 * fk });
    flame.ellipse(bx, by - 18, 0.8, 2).fill({ color: PALETTE.ivory, alpha: 0.9 * fk });

    dyn.clear();
    for (const b of beakers) {
      const bx2 = b.x;
      const by2 = h - 14 - b.baseH;
      const fillH = b.baseH * 0.65;
      const liquidY = by2 + b.baseH - fillH;
      // Liquid
      dyn.rect(bx2 + 0.5, liquidY, b.baseW - 1, fillH)
        .fill({ color: b.color, alpha: 0.6 });
      // Surface meniscus
      dyn.rect(bx2 + 0.5, liquidY, b.baseW - 1, 0.8)
        .fill({ color: PALETTE.ivory, alpha: 0.5 });
      // Bubbles (3 per beaker)
      for (let i = 0; i < 3; i++) {
        const phase = t * 1.2 + b.phase + i * 0.7;
        const bubY = (liquidY + b.baseH * 0.5) + (Math.sin(phase) * fillH * 0.4);
        const bubX = bx2 + b.baseW * (0.3 + 0.2 * Math.sin(phase * 1.3));
        const bubR = 0.6 + 0.3 * Math.abs(Math.cos(phase));
        dyn.circle(bubX, bubY, bubR).fill({ color: PALETTE.ivory, alpha: 0.6 });
      }
    }
  };
  return { view, tick };
}

// ═══════════════════ MICROSCOPE STATION + PETRI DISHES ═══════════════════

export function buildMicroscopeStation(opts: {
  width: number;
  height: number;
  accent?: number;
}): NovaProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  // Bench
  const bench = new Graphics();
  bench.rect(0, h - 12, w, 12).fill({ color: PALETTE.steel800 });
  bench.rect(0, h - 12, w, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  bench.rect(0, h - 12, w, 12).stroke({ color: PALETTE.charcoal, width: 0.6 });
  view.addChild(bench);

  // Microscope (top-down)
  const scope = new Graphics();
  const sx = w * 0.25;
  const sy = h - 12 - 6;
  scope.rect(sx - 6, sy - 4, 12, 8).fill({ color: PALETTE.steel700 });
  scope.rect(sx - 6, sy - 4, 12, 8).stroke({ color: PALETTE.charcoal, width: 0.5 });
  scope.circle(sx, sy, 4).fill({ color: PALETTE.steel900 });
  scope.circle(sx, sy, 4).stroke({ color: accent, width: 0.6, alpha: 0.85 });
  scope.circle(sx, sy, 2).fill({ color: PALETTE.charcoal });
  scope.circle(sx, sy, 1).fill({ color: PALETTE.hologramTeal, alpha: 0.85 });
  // Stage clips
  scope.rect(sx - 7, sy + 4, 4, 1).fill({ color: PALETTE.steel400 });
  scope.rect(sx + 3, sy + 4, 4, 1).fill({ color: PALETTE.steel400 });
  view.addChild(scope);

  // Petri dish array (right side)
  const dishes = [
    { x: w * 0.6, color: accent },
    { x: w * 0.75, color: PALETTE.lore },
    { x: w * 0.9, color: PALETTE.hologramTeal },
  ];
  const staticD = new Graphics();
  view.addChild(staticD);
  for (const d of dishes) {
    staticD.circle(d.x, sy, 5).fill({ color: PALETTE.steel900 });
    staticD.circle(d.x, sy, 5).stroke({ color: PALETTE.steel400, width: 0.5 });
    staticD.circle(d.x, sy, 4).stroke({ color: PALETTE.steel500, width: 0.3, alpha: 0.6 });
  }

  // Title
  const title = new Text({
    text: "BIO-LAB // SAMPLE TRAY",
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 1,
    }),
  });
  title.position.set(2, 2);
  view.addChild(title);

  // Dynamic: cell motion in dishes + scope highlight
  const dyn = new Graphics();
  view.addChild(dyn);
  const tick = (t: number) => {
    dyn.clear();
    // Scope eyepiece pulse
    const k = 0.7 + Math.sin(t * 3) * 0.25;
    dyn.circle(sx, sy, 1.4).fill({ color: PALETTE.hologramTeal, alpha: k });
    dyn.circle(sx, sy, 3).fill({ color: PALETTE.hologramTeal, alpha: 0.18 * k });

    // Cells drifting in petri dishes
    for (let di = 0; di < dishes.length; di++) {
      const d = dishes[di];
      for (let i = 0; i < 5; i++) {
        const phase = t * 0.6 + i * 1.1 + di * 0.4;
        const cx = d.x + Math.cos(phase) * 3;
        const cy = sy + Math.sin(phase * 1.3) * 3;
        dyn.circle(cx, cy, 0.6).fill({ color: d.color, alpha: 0.85 });
      }
    }
  };
  return { view, tick };
}

// ═══════════════════ OSCILLOSCOPE ═══════════════════
// Wide display: main waveform + FFT spectrum below.

export function buildOscilloscope(opts: {
  width: number;
  height: number;
  accent?: number;
}): NovaProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.nova;
  const view = new Container();

  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  frame.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  frame.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.5 });
  // Title bar
  frame.rect(0, 0, w, 8).fill({ color: PALETTE.charcoal });
  view.addChild(frame);

  const title = new Text({
    text: "OSCILLO // CH-A 50mV/div  CH-B 20mV/div  TB 1ms",
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 1,
    }),
  });
  title.position.set(3, 1.5);
  view.addChild(title);

  // Two screen panes — top wave, bottom spectrum
  const splitY = 8 + (h - 8) * 0.55;
  const wavePane = { x: 4, y: 12, w: w - 8, h: splitY - 14 };
  const fftPane = { x: 4, y: splitY + 2, w: w - 8, h: h - splitY - 6 };
  const grid = new Graphics();
  // Wave pane background grid
  grid.rect(wavePane.x, wavePane.y, wavePane.w, wavePane.h).fill({ color: PALETTE.charcoal });
  grid.rect(wavePane.x, wavePane.y, wavePane.w, wavePane.h)
    .stroke({ color: PALETTE.steel500, width: 0.4, alpha: 0.7 });
  for (let x = wavePane.x + 8; x < wavePane.x + wavePane.w; x += 8) {
    grid.moveTo(x, wavePane.y).lineTo(x, wavePane.y + wavePane.h)
      .stroke({ color: accent, width: 0.2, alpha: 0.18 });
  }
  for (let y = wavePane.y + 4; y < wavePane.y + wavePane.h; y += 4) {
    grid.moveTo(wavePane.x, y).lineTo(wavePane.x + wavePane.w, y)
      .stroke({ color: accent, width: 0.2, alpha: 0.15 });
  }
  // FFT pane background
  grid.rect(fftPane.x, fftPane.y, fftPane.w, fftPane.h).fill({ color: PALETTE.charcoal });
  grid.rect(fftPane.x, fftPane.y, fftPane.w, fftPane.h)
    .stroke({ color: PALETTE.steel500, width: 0.4, alpha: 0.7 });
  view.addChild(grid);

  // Dynamic: waveforms + FFT bars
  const dyn = new Graphics();
  view.addChild(dyn);

  const tick = (t: number) => {
    dyn.clear();
    // Wave A
    const wcy = wavePane.y + wavePane.h / 2;
    let prevX = wavePane.x;
    let prevY = wcy;
    for (let x = wavePane.x; x < wavePane.x + wavePane.w; x += 1) {
      const f = (x - wavePane.x) * 0.18 + t * 4;
      const y = wcy + Math.sin(f) * (wavePane.h * 0.35) * (0.7 + Math.sin(t * 0.5 + x * 0.02) * 0.3);
      if (x > wavePane.x) {
        dyn.moveTo(prevX, prevY).lineTo(x, y).stroke({ color: accent, width: 0.6, alpha: 0.95 });
      }
      prevX = x;
      prevY = y;
    }
    // Wave B (offset, smaller amp)
    let prevX2 = wavePane.x;
    let prevY2 = wcy;
    for (let x = wavePane.x; x < wavePane.x + wavePane.w; x += 1) {
      const f = (x - wavePane.x) * 0.32 - t * 3;
      const y = wcy + Math.cos(f) * (wavePane.h * 0.22);
      if (x > wavePane.x) {
        dyn.moveTo(prevX2, prevY2).lineTo(x, y).stroke({ color: PALETTE.hologramTeal, width: 0.5, alpha: 0.85 });
      }
      prevX2 = x;
      prevY2 = y;
    }
    // FFT bars
    const bars = Math.floor(fftPane.w / 3);
    for (let i = 0; i < bars; i++) {
      const v = (Math.sin(t * 1.2 + i * 0.4) * 0.5 + 0.5)
              * (Math.sin(t * 0.4 + i * 0.13) * 0.4 + 0.6);
      const bh = v * (fftPane.h - 4);
      dyn.rect(fftPane.x + 1 + i * 3, fftPane.y + fftPane.h - 1 - bh, 2, bh)
        .fill({ color: accent, alpha: 0.55 + v * 0.35 });
    }
  };

  return { view, tick };
}
