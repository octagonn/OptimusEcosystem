import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface ScoutProp {
  view: Container;
  tick: (t: number) => void;
}

// ═══════════════════ RADAR SWEEP PPI ═══════════════════
// Wide-format plan position indicator. Sweeping trace leaves a fading
// radial trail; contact blips appear randomly and pulse-fade.

export function buildRadarSweepWall(opts: {
  width: number;
  height: number;
  accent?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  // Frame + title
  const frame = new Graphics();
  frame.roundRect(0, 0, W, H, 4).fill({ color: PALETTE.charcoal });
  frame.roundRect(0, 0, W, H, 4).stroke({ color: accent, width: 1, alpha: 0.85 });
  frame.rect(0, 0, W, 14).fill({ color: PALETTE.steel800 });
  frame.rect(0, 14, W, 1).fill({ color: accent, alpha: 0.6 });
  view.addChild(frame);

  const titleStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 8, fill: accent, letterSpacing: 1.2,
  });
  const title = new Text({ text: "RADAR PPI // SECTOR-07", style: titleStyle });
  title.position.set(6, 3);
  view.addChild(title);

  const rxStyle = new TextStyle({ fontFamily: "monospace", fontSize: 7, fill: PALETTE.steel400 });
  const rxText = new Text({ text: "RX: 2425 MHz", style: rxStyle });
  rxText.position.set(W - 80, 3);
  view.addChild(rxText);

  // Scope geometry — PPI is circular; height defines radius
  const scopeH = H - 14;
  const cy = 14 + scopeH / 2;
  const radius = scopeH / 2 - 4;
  const centers = [W * 0.25, W * 0.5, W * 0.75];

  // Static range rings + crosshairs for each PPI
  const rings = new Graphics();
  for (const cx of centers) {
    for (let r = radius; r > 0; r -= radius / 4) {
      rings.circle(cx, cy, r).stroke({ color: accent, width: 0.5, alpha: 0.35 });
    }
    rings.moveTo(cx - radius, cy).lineTo(cx + radius, cy).stroke({ color: accent, width: 0.4, alpha: 0.3 });
    rings.moveTo(cx, cy - radius).lineTo(cx, cy + radius).stroke({ color: accent, width: 0.4, alpha: 0.3 });
  }
  view.addChild(rings);

  // Cardinal labels
  const labelStyle = new TextStyle({ fontFamily: "monospace", fontSize: 6, fill: accent });
  for (const cx of centers) {
    const n = new Text({ text: "N", style: labelStyle });
    n.position.set(cx - 3, cy - radius - 8);
    view.addChild(n);
    const s = new Text({ text: "S", style: labelStyle });
    s.position.set(cx - 3, cy + radius + 1);
    view.addChild(s);
  }

  // Sweep layer (one Graphics, cleared each frame)
  const sweep = new Graphics();
  sweep.blendMode = "add";
  view.addChild(sweep);

  // Blip pool (per scope)
  type Blip = { cx: number; ang: number; r: number; life: number };
  const blips: Blip[] = Array.from({ length: 16 }, () => ({ cx: centers[0], ang: 0, r: 0, life: 0 }));

  const blipLayer = new Graphics();
  blipLayer.blendMode = "add";
  blipLayer.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(blipLayer);

  let blipTimer = 0;
  let tLast = 0;

  return {
    view,
    tick: (t: number) => {
      const dt = Math.min(0.1, t - tLast);
      tLast = t;

      // Three sweeps phased apart, same angular rate
      sweep.clear();
      const base = t * 1.1;
      for (let i = 0; i < centers.length; i++) {
        const cx = centers[i];
        const ang = (base + i * 2.1) % (Math.PI * 2);
        // Trailing wedge
        for (let k = 0; k < 24; k++) {
          const a = ang - k * 0.06;
          const alpha = ((24 - k) / 24) * 0.55;
          const x1 = cx + Math.cos(a) * radius;
          const y1 = cy + Math.sin(a) * radius;
          sweep.moveTo(cx, cy).lineTo(x1, y1)
            .stroke({ color: PALETTE.scout, width: 1.2, alpha });
        }
        // Leading edge bright
        sweep.moveTo(cx, cy).lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius)
          .stroke({ color: PALETTE.scout, width: 1.8, alpha: 0.95 });
      }

      // Spawn blips periodically
      blipTimer += dt;
      if (blipTimer > 0.35 && Math.random() < 0.75) {
        blipTimer = 0;
        const b = blips.find((p) => p.life <= 0);
        if (b) {
          b.cx = centers[Math.floor(Math.random() * centers.length)];
          b.ang = Math.random() * Math.PI * 2;
          b.r = 6 + Math.random() * (radius - 8);
          b.life = 1.4 + Math.random() * 0.8;
        }
      }

      blipLayer.clear();
      for (const b of blips) {
        if (b.life <= 0) continue;
        b.life -= dt;
        const a = Math.min(1, b.life / 1.4);
        const bx = b.cx + Math.cos(b.ang) * b.r;
        const by = cy + Math.sin(b.ang) * b.r;
        blipLayer.circle(bx, by, 1.8).fill({ color: PALETTE.warningGold, alpha: a });
        blipLayer.circle(bx, by, 5).fill({ color: PALETTE.warningGold, alpha: a * 0.3 });
      }
    },
  };
}

// ═══════════════════ CONTACT BOARD ═══════════════════
// LCARS-style scrolling contact table: BEARING | RANGE | CLASS rows.
// Rows tick and occasionally refresh/shift.

export function buildContactBoard(opts: {
  width: number;
  height: number;
  accent?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  const frame = new Graphics();
  frame.roundRect(0, 0, W, H, 3).fill({ color: PALETTE.charcoal });
  frame.roundRect(0, 0, W, H, 3).stroke({ color: accent, width: 0.8, alpha: 0.8 });
  frame.rect(0, 0, W, 12).fill({ color: PALETTE.steel800 });
  frame.rect(0, 12, W, 1).fill({ color: accent, alpha: 0.6 });
  view.addChild(frame);

  const titleStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 7, fill: accent, letterSpacing: 1,
  });
  const title = new Text({ text: "CONTACT REGISTER", style: titleStyle });
  title.position.set(5, 2);
  view.addChild(title);

  // Column headers
  const hdrStyle = new TextStyle({ fontFamily: "monospace", fontSize: 6, fill: PALETTE.steel400 });
  const headers = ["ID", "BRG", "RNG", "CLS"];
  const cols = [6, W * 0.3, W * 0.55, W * 0.8];
  for (let i = 0; i < headers.length; i++) {
    const h = new Text({ text: headers[i], style: hdrStyle });
    h.position.set(cols[i], 16);
    view.addChild(h);
  }

  // Data rows
  const rowStyle = new TextStyle({ fontFamily: "monospace", fontSize: 6, fill: PALETTE.steel200 });
  const classes = ["A", "B", "C", "UNK"];
  type Row = { id: Text; brg: Text; rng: Text; cls: Text; dot: Graphics; seed: number };
  const rows: Row[] = [];
  const rowCount = Math.max(3, Math.floor((H - 26) / 9));
  for (let i = 0; i < rowCount; i++) {
    const y = 26 + i * 9;
    const dot = new Graphics();
    dot.circle(0, 0, 1.5).fill({ color: accent, alpha: 0.8 });
    dot.position.set(2, y + 3);
    view.addChild(dot);
    const id = new Text({ text: "", style: rowStyle });
    id.position.set(cols[0], y);
    view.addChild(id);
    const brg = new Text({ text: "", style: rowStyle });
    brg.position.set(cols[1], y);
    view.addChild(brg);
    const rng = new Text({ text: "", style: rowStyle });
    rng.position.set(cols[2], y);
    view.addChild(rng);
    const cls = new Text({ text: "", style: rowStyle });
    cls.position.set(cols[3], y);
    view.addChild(cls);
    rows.push({ id, brg, rng, cls, dot, seed: Math.random() * 100 });
  }

  const renderRow = (r: Row, t: number) => {
    const idNum = Math.floor(r.seed * 997) % 900 + 100;
    r.id.text = `T-${idNum}`;
    const brg = Math.floor((r.seed * 360 + t * 2) % 360);
    r.brg.text = `${brg.toString().padStart(3, "0")}°`;
    const rng = Math.floor((r.seed * 50 + Math.sin(t + r.seed) * 4 + 20) * 10) / 10;
    r.rng.text = `${rng.toFixed(1)}km`;
    r.cls.text = classes[Math.floor(r.seed * classes.length) % classes.length];
  };

  let tLast = 0;
  let refresh = 0;
  return {
    view,
    tick: (t: number) => {
      const dt = Math.min(0.1, t - tLast);
      tLast = t;
      refresh += dt;
      if (refresh > 0.4) {
        refresh = 0;
        for (const r of rows) renderRow(r, t);
        // Random row shuffle
        if (Math.random() < 0.3) {
          const r = rows[Math.floor(Math.random() * rows.length)];
          r.seed = Math.random() * 100;
        }
      }
    },
  };
}

// ═══════════════════ FREQUENCY ANALYZER ═══════════════════
// FFT spectrum with animated bars + peak-hold line.

export function buildFrequencyAnalyzer(opts: {
  width: number;
  height: number;
  accent?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  const frame = new Graphics();
  frame.roundRect(0, 0, W, H, 3).fill({ color: PALETTE.charcoal });
  frame.roundRect(0, 0, W, H, 3).stroke({ color: accent, width: 0.8, alpha: 0.8 });
  frame.rect(0, 0, W, 12).fill({ color: PALETTE.steel800 });
  frame.rect(0, 12, W, 1).fill({ color: accent, alpha: 0.6 });
  view.addChild(frame);

  const titleStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 7, fill: accent, letterSpacing: 1,
  });
  const title = new Text({ text: "SPECTRUM  88-108 MHz", style: titleStyle });
  title.position.set(5, 2);
  view.addChild(title);

  // Grid
  const grid = new Graphics();
  const padX = 8;
  const padTop = 16;
  const padBot = 10;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBot;
  grid.rect(padX, padTop, plotW, plotH).stroke({ color: accent, width: 0.4, alpha: 0.35 });
  for (let i = 1; i < 4; i++) {
    const y = padTop + (plotH * i) / 4;
    grid.moveTo(padX, y).lineTo(padX + plotW, y).stroke({ color: accent, width: 0.3, alpha: 0.2 });
  }
  view.addChild(grid);

  // Frequency axis labels
  const axStyle = new TextStyle({ fontFamily: "monospace", fontSize: 5, fill: PALETTE.steel400 });
  ["88", "95", "100", "108"].forEach((lbl, i) => {
    const tx = new Text({ text: lbl, style: axStyle });
    tx.position.set(padX + (plotW * i) / 3 - 4, padTop + plotH + 1);
    view.addChild(tx);
  });

  // Bars + peak-hold layer
  const barLayer = new Graphics();
  view.addChild(barLayer);
  const peakLayer = new Graphics();
  peakLayer.blendMode = "add";
  view.addChild(peakLayer);

  const N = 32;
  const barW = plotW / N;
  const peaks = new Array(N).fill(0);
  const peakDecay = 0.08;
  const seeds = Array.from({ length: N }, () => Math.random() * 10);

  let tLast = 0;
  return {
    view,
    tick: (t: number) => {
      const dt = Math.min(0.1, t - tLast);
      tLast = t;

      barLayer.clear();
      peakLayer.clear();
      for (let i = 0; i < N; i++) {
        const noise = Math.sin(t * 4 + seeds[i]) * 0.25
          + Math.sin(t * 1.7 + seeds[i] * 2.3) * 0.2;
        const carrier = i > 10 && i < 14 ? 0.6 + Math.sin(t * 5) * 0.15 :
                        i > 20 && i < 23 ? 0.45 + Math.sin(t * 3.3) * 0.12 : 0;
        const amp = Math.max(0.05, Math.min(1, 0.3 + noise + carrier));
        const bh = amp * plotH;
        const bx = padX + i * barW + 0.5;
        const by = padTop + plotH - bh;

        barLayer.rect(bx, by, barW - 1, bh).fill({ color: accent, alpha: 0.85 });

        // Peak hold
        if (amp > peaks[i]) peaks[i] = amp;
        else peaks[i] = Math.max(0, peaks[i] - peakDecay * dt * 10);

        const py = padTop + plotH - peaks[i] * plotH;
        peakLayer.rect(bx, py - 0.8, barW - 1, 1).fill({ color: PALETTE.warningGold, alpha: 0.9 });
      }
    },
  };
}

// ═══════════════════ TRIANGULATION MAP ═══════════════════
// Top-down map with 3 receiver stations and intersecting bearing lines
// converging on a pulsing target.

export function buildTriangulationMap(opts: {
  width: number;
  height: number;
  accent?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  const frame = new Graphics();
  frame.roundRect(0, 0, W, H, 4).fill({ color: PALETTE.charcoal });
  frame.roundRect(0, 0, W, H, 4).stroke({ color: accent, width: 0.9, alpha: 0.85 });
  frame.rect(0, 0, W, 12).fill({ color: PALETTE.steel800 });
  frame.rect(0, 12, W, 1).fill({ color: accent, alpha: 0.6 });
  view.addChild(frame);

  const titleStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 7, fill: accent, letterSpacing: 1,
  });
  const title = new Text({ text: "TRIANGULATION / GEO-FIX", style: titleStyle });
  title.position.set(5, 2);
  view.addChild(title);

  // Terrain backdrop — pseudo-contour polygons
  const terrain = new Graphics();
  const padY = 18;
  const mapH = H - padY - 6;
  // Base grid
  for (let x = 6; x < W - 6; x += 14) {
    terrain.moveTo(x, padY).lineTo(x, padY + mapH).stroke({ color: accent, width: 0.3, alpha: 0.18 });
  }
  for (let y = padY + 8; y < padY + mapH; y += 14) {
    terrain.moveTo(6, y).lineTo(W - 6, y).stroke({ color: accent, width: 0.3, alpha: 0.18 });
  }
  // Soft contour blobs
  for (let i = 0; i < 3; i++) {
    const cx = 20 + i * 35;
    const cy = padY + 18 + (i % 2) * 12;
    for (let r = 16; r > 3; r -= 4) {
      terrain.circle(cx, cy, r).stroke({ color: accent, width: 0.3, alpha: 0.22 });
    }
  }
  view.addChild(terrain);

  // Receiver stations
  const stations = [
    { x: W * 0.18, y: padY + mapH * 0.25 },
    { x: W * 0.82, y: padY + mapH * 0.3 },
    { x: W * 0.35, y: padY + mapH * 0.85 },
  ];
  const stationGfx = new Graphics();
  for (const s of stations) {
    stationGfx.circle(s.x, s.y, 3).fill({ color: accent });
    stationGfx.circle(s.x, s.y, 5).stroke({ color: accent, width: 0.6, alpha: 0.6 });
  }
  view.addChild(stationGfx);

  // Station labels
  const lblStyle = new TextStyle({ fontFamily: "monospace", fontSize: 5, fill: PALETTE.steel300 });
  stations.forEach((s, i) => {
    const tx = new Text({ text: `RX-${i + 1}`, style: lblStyle });
    tx.position.set(s.x + 5, s.y - 4);
    view.addChild(tx);
  });

  // Dynamic layers: bearing lines + target
  const bearings = new Graphics();
  bearings.blendMode = "add";
  view.addChild(bearings);

  const target = new Graphics();
  target.blendMode = "add";
  target.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(target);

  // Moving target slowly orbits
  return {
    view,
    tick: (t: number) => {
      const tx = W * 0.55 + Math.cos(t * 0.3) * 20;
      const ty = padY + mapH * 0.55 + Math.sin(t * 0.27) * 12;

      bearings.clear();
      for (const s of stations) {
        const dx = tx - s.x;
        const dy = ty - s.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ex = s.x + (dx / len) * (len + 15);
        const ey = s.y + (dy / len) * (len + 15);
        bearings.moveTo(s.x, s.y).lineTo(ex, ey)
          .stroke({ color: PALETTE.warningGold, width: 0.8, alpha: 0.45 });
      }

      target.clear();
      const pulse = 0.5 + Math.sin(t * 4) * 0.5;
      target.circle(tx, ty, 3).fill({ color: PALETTE.warningGold, alpha: 1 });
      target.circle(tx, ty, 6 + pulse * 4).fill({ color: PALETTE.warningGold, alpha: 0.35 });
      target.circle(tx, ty, 10 + pulse * 5).stroke({ color: PALETTE.warningGold, width: 0.6, alpha: 0.55 });
    },
  };
}

// ═══════════════════ ANTENNA ARRAY ═══════════════════
// Side-view truss with a row of antennas (dishes + whips).
// Per-antenna RX LED blinks at independent rates, signal strength bars vary.

export function buildAntennaArray(opts: {
  width: number;
  height: number;
  accent?: number;
  count?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const count = opts.count ?? 5;
  const view = new Container();

  // Frame + truss
  const base = new Graphics();
  base.roundRect(0, 0, W, H, 2).fill({ color: PALETTE.charcoal });
  base.roundRect(0, 0, W, H, 2).stroke({ color: accent, width: 0.7, alpha: 0.75 });
  // Truss beam
  const beamY = H - 10;
  base.rect(4, beamY, W - 8, 4).fill({ color: PALETTE.steel700 });
  base.rect(4, beamY, W - 8, 1).fill({ color: PALETTE.steel400, alpha: 0.7 });
  // Ground
  base.rect(0, H - 4, W, 4).fill({ color: PALETTE.steel800 });
  view.addChild(base);

  // Antennas
  const antennaX = (i: number) => 10 + (W - 20) * (i / (count - 1));
  const antGfx = new Graphics();
  const leds: { x: number; y: number; phase: number; speed: number }[] = [];
  const strengths: { x: number; y: number; phase: number }[] = [];

  for (let i = 0; i < count; i++) {
    const ax = antennaX(i);
    // Mast
    antGfx.rect(ax - 0.5, 10, 1, beamY - 10).fill({ color: PALETTE.steel500 });
    if (i % 2 === 0) {
      // Dish
      antGfx.moveTo(ax - 6, 10).quadraticCurveTo(ax, 4, ax + 6, 10)
        .fill({ color: PALETTE.steel700 })
        .stroke({ color: accent, width: 0.6, alpha: 0.8 });
      antGfx.circle(ax, 8, 1).fill({ color: accent });
    } else {
      // Whip stack
      antGfx.rect(ax - 2, 6, 4, 2).fill({ color: PALETTE.steel600 });
      antGfx.rect(ax - 0.5, 2, 1, 8).fill({ color: PALETTE.steel400 });
      antGfx.circle(ax, 2, 1).fill({ color: accent });
    }
    leds.push({ x: ax, y: beamY - 2, phase: Math.random() * 10, speed: 2 + Math.random() * 2.5 });
    strengths.push({ x: ax - 3, y: H - 8, phase: Math.random() * 10 });
  }
  view.addChild(antGfx);

  const dyn = new Graphics();
  dyn.blendMode = "add";
  view.addChild(dyn);

  return {
    view,
    tick: (t: number) => {
      dyn.clear();
      // RX LEDs
      for (const l of leds) {
        const on = ((Math.sin(t * l.speed + l.phase) + 1) / 2) > 0.55 ? 1 : 0.2;
        dyn.circle(l.x, l.y, 1.3).fill({ color: PALETTE.warningGold, alpha: on });
      }
      // Strength bars (4 segments per antenna)
      for (const s of strengths) {
        const amp = (Math.sin(t * 1.8 + s.phase) + 1) / 2;
        for (let j = 0; j < 4; j++) {
          const on = j / 4 < amp;
          dyn.rect(s.x + j * 1.5, s.y, 1, 2).fill({
            color: on ? PALETTE.scout : PALETTE.steel800,
            alpha: on ? 0.9 : 0.6,
          });
        }
      }
    },
  };
}

// ═══════════════════ SATELLITE UPLINK ═══════════════════
// Tilted parabolic dish with uplink beam cone to a small orbital satellite.

export function buildSatelliteUplink(opts: {
  width: number;
  height: number;
  accent?: number;
}): ScoutProp {
  const { width: W, height: H } = opts;
  const accent = opts.accent ?? PALETTE.scout;
  const view = new Container();

  const base = new Graphics();
  base.roundRect(0, 0, W, H, 3).fill({ color: PALETTE.charcoal });
  base.roundRect(0, 0, W, H, 3).stroke({ color: accent, width: 0.7, alpha: 0.75 });
  view.addChild(base);

  // Ground mount
  const mount = new Graphics();
  const mx = W * 0.25;
  const my = H - 8;
  mount.rect(mx - 6, my, 12, 8).fill({ color: PALETTE.steel800 });
  mount.rect(mx - 1, my - 16, 2, 16).fill({ color: PALETTE.steel600 });
  view.addChild(mount);

  // Dish (tilted up-right) — tilted ellipse
  const dish = new Graphics();
  const dx = mx;
  const dy = my - 20;
  // Dish bowl (drawn as a tilted arc)
  dish.ellipse(dx, dy, 14, 6).fill({ color: PALETTE.steel700 });
  dish.ellipse(dx, dy, 14, 6).stroke({ color: accent, width: 0.6, alpha: 0.8 });
  dish.ellipse(dx, dy + 1, 10, 3).fill({ color: PALETTE.charcoal, alpha: 0.6 });
  // Feed horn
  dish.rect(dx - 1, dy - 10, 2, 10).fill({ color: PALETTE.steel500 });
  dish.circle(dx, dy - 10, 1.5).fill({ color: accent });
  view.addChild(dish);

  // Satellite (upper right)
  const sx = W * 0.82;
  const sy = 16;
  const sat = new Graphics();
  sat.rect(sx - 3, sy - 2, 6, 4).fill({ color: PALETTE.steel500 });
  sat.rect(sx - 3, sy - 2, 6, 4).stroke({ color: accent, width: 0.5 });
  // Solar panels
  sat.rect(sx - 12, sy - 1, 8, 2).fill({ color: PALETTE.anvil, alpha: 0.8 });
  sat.rect(sx + 4, sy - 1, 8, 2).fill({ color: PALETTE.anvil, alpha: 0.8 });
  // Antenna
  sat.rect(sx - 0.5, sy - 6, 1, 4).fill({ color: PALETTE.steel400 });
  view.addChild(sat);

  const satLbl = new Text({
    text: "GEO-41",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 6, fill: PALETTE.steel300 }),
  });
  satLbl.position.set(sx - 8, sy + 4);
  view.addChild(satLbl);

  // Beam + uplink pulses
  const beam = new Graphics();
  beam.blendMode = "add";
  beam.filters = [new BlurFilter({ strength: 2.5, quality: 2 })];
  view.addChild(beam);

  const titleStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 6, fill: accent, letterSpacing: 1,
  });
  const title = new Text({ text: "UPLINK // 14.5 GHz", style: titleStyle });
  title.position.set(4, 3);
  view.addChild(title);

  return {
    view,
    tick: (t: number) => {
      beam.clear();
      // Beam cone
      const ang = Math.atan2(sy - dy, sx - dx);
      const spread = 0.05;
      const len = Math.hypot(sx - dx, sy - dy);
      const px1 = dx + Math.cos(ang - spread) * len;
      const py1 = dy + Math.sin(ang - spread) * len;
      const px2 = dx + Math.cos(ang + spread) * len;
      const py2 = dy + Math.sin(ang + spread) * len;
      beam.poly([dx, dy - 10, px1, py1, px2, py2])
        .fill({ color: PALETTE.scout, alpha: 0.22 });

      // Pulses travelling toward satellite
      for (let i = 0; i < 3; i++) {
        const p = ((t * 0.55 + i / 3) % 1);
        const px = dx + (sx - dx) * p;
        const py = (dy - 10) + ((sy) - (dy - 10)) * p;
        beam.circle(px, py, 1.8).fill({ color: PALETTE.scout, alpha: (1 - p) * 0.9 });
      }
    },
  };
}
