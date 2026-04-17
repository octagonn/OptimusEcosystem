import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface ForgeProp {
  view: Container;
  tick: (t: number) => void;
}

const noop = (_: number) => {};

// ═══════════════════ ROBOTIC ARM ═══════════════════
// 3-segment articulated arm. Anchored at base. Pick/place cycle:
// reach → grip → lift → swing → release. Returns getGripperWorld so
// callers can spawn sparks at the grip point.

export interface RoboticArmProp extends ForgeProp {
  /** Local coordinates of the gripper relative to the arm base */
  getGripperLocal: () => { x: number; y: number; gripping: boolean };
}

export function buildRoboticArm(opts: {
  accent?: number;
  upperLen?: number;
  lowerLen?: number;
  cycleSec?: number;
}): RoboticArmProp {
  const accent = opts.accent ?? PALETTE.forge;
  const upper = opts.upperLen ?? 38;
  const lower = opts.lowerLen ?? 32;
  const cycle = opts.cycleSec ?? 3.6;

  const view = new Container();

  // Static base disk
  const base = new Graphics();
  base.circle(0, 0, 11).fill({ color: PALETTE.steel700 });
  base.circle(0, 0, 11).stroke({ color: PALETTE.charcoal, width: 1 });
  base.circle(0, 0, 7).fill({ color: PALETTE.steel500 });
  base.circle(0, 0, 7).stroke({ color: PALETTE.charcoal, width: 0.5 });
  base.circle(0, 0, 3).fill({ color: accent, alpha: 0.85 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    base.circle(Math.cos(a) * 8.5, Math.sin(a) * 8.5, 0.6).fill({ color: PALETTE.steel300 });
  }
  view.addChild(base);

  // Arm graphics, redrawn per frame
  const arm = new Graphics();
  view.addChild(arm);

  // Gripper position state for callers
  const gripper = { x: 0, y: 0, gripping: false };

  const tick = (t: number) => {
    arm.clear();
    const phase = ((t % cycle) / cycle) * Math.PI * 2;

    // Shoulder swing — slow oscillation across center bench
    const shoulder = -Math.PI / 2 + Math.sin(phase) * 0.9;
    // Elbow extension — pumps in/out
    const elbow = -1.1 + Math.cos(phase * 2) * 0.55;

    // Pivot points
    const sx = 0;
    const sy = 0;
    const ex = sx + Math.cos(shoulder) * upper;
    const ey = sy + Math.sin(shoulder) * upper;
    const wx = ex + Math.cos(shoulder + elbow) * lower;
    const wy = ey + Math.sin(shoulder + elbow) * lower;

    gripper.x = wx;
    gripper.y = wy;
    // Gripping during the bottom of the swing (when reaching the anvil)
    gripper.gripping = Math.sin(phase) > 0.7;

    // Upper segment
    arm.moveTo(sx, sy).lineTo(ex, ey).stroke({ color: PALETTE.steel400, width: 6 });
    arm.moveTo(sx, sy).lineTo(ex, ey).stroke({ color: PALETTE.steel200, width: 1.5, alpha: 0.4 });
    // Shoulder pivot
    arm.circle(sx, sy, 4).fill({ color: PALETTE.steel600 });
    arm.circle(sx, sy, 2).fill({ color: accent, alpha: 0.9 });

    // Lower segment
    arm.moveTo(ex, ey).lineTo(wx, wy).stroke({ color: PALETTE.steel500, width: 5 });
    arm.moveTo(ex, ey).lineTo(wx, wy).stroke({ color: PALETTE.steel200, width: 1.2, alpha: 0.35 });
    // Elbow pivot
    arm.circle(ex, ey, 3.5).fill({ color: PALETTE.steel600 });
    arm.circle(ex, ey, 1.6).fill({ color: accent, alpha: 0.9 });

    // Gripper — two prongs facing along arm direction
    const dir = shoulder + elbow;
    const px = Math.cos(dir);
    const py = Math.sin(dir);
    const nx = -py;
    const ny = px;
    const open = gripper.gripping ? 1.5 : 4;
    const grip1x = wx + nx * open;
    const grip1y = wy + ny * open;
    const grip2x = wx - nx * open;
    const grip2y = wy - ny * open;
    arm.moveTo(wx, wy).lineTo(grip1x + px * 5, grip1y + py * 5)
      .stroke({ color: PALETTE.steel400, width: 2 });
    arm.moveTo(wx, wy).lineTo(grip2x + px * 5, grip2y + py * 5)
      .stroke({ color: PALETTE.steel400, width: 2 });
    arm.circle(wx, wy, 2.4).fill({ color: PALETTE.steel700 });
    arm.circle(wx, wy, 1).fill({ color: gripper.gripping ? PALETTE.warningGold : accent, alpha: 0.95 });
  };

  return { view, tick, getGripperLocal: () => gripper };
}

// ═══════════════════ BLUEPRINT HOLO DESK ═══════════════════
// Tilted drafting desk + paper blueprint with scanning line + holographic
// rotating wireframe square floating above.

export function buildBlueprintHoloDesk(opts: {
  width: number;
  height: number;
  accent?: number;
}): ForgeProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.forge;
  const view = new Container();

  // Desk legs / base
  const base = new Graphics();
  base.rect(0, h - 6, w, 6).fill({ color: PALETTE.steel800 });
  base.rect(0, h - 6, w, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  // Tilted top (parallelogram for slight perspective)
  base.poly([3, h - 6, w - 3, h - 6, w - 8, 4, 8, 4]).fill({ color: PALETTE.steel700 });
  base.poly([3, h - 6, w - 3, h - 6, w - 8, 4, 8, 4])
    .stroke({ color: PALETTE.charcoal, width: 0.8 });
  // Blueprint paper (lighter)
  base.poly([12, h - 10, w - 12, h - 10, w - 14, 8, 14, 8])
    .fill({ color: 0x152540 })
    .stroke({ color: accent, width: 0.6, alpha: 0.6 });
  // Blueprint contents — schematic lines
  const bx = w / 2;
  const by = (h - 4) * 0.55;
  base.rect(bx - 18, by - 10, 36, 20).stroke({ color: PALETTE.scout, width: 0.4, alpha: 0.6 });
  base.rect(bx - 12, by - 5, 24, 10).stroke({ color: PALETTE.scout, width: 0.4, alpha: 0.5 });
  base.circle(bx, by, 3).stroke({ color: PALETTE.scout, width: 0.4, alpha: 0.5 });
  // Dimension ticks
  for (let i = 0; i < 5; i++) {
    const tx = bx - 16 + i * 8;
    base.moveTo(tx, by + 12).lineTo(tx, by + 14).stroke({ color: PALETTE.scout, width: 0.3, alpha: 0.5 });
  }
  // Drafting compass icon
  base.moveTo(20, h - 14).lineTo(28, h - 22).stroke({ color: PALETTE.steel300, width: 0.8 });
  base.moveTo(28, h - 22).lineTo(36, h - 14).stroke({ color: PALETTE.steel300, width: 0.8 });
  base.circle(28, h - 22, 1).fill({ color: accent });
  view.addChild(base);

  // Holo emitter dots on desk corners
  const emit = new Graphics();
  view.addChild(emit);
  const emitCx = w / 2;
  const emitCy = 8;

  // Holo cone + rotating wireframe (additive layer)
  const holo = new Graphics();
  holo.blendMode = "add";
  holo.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(holo);
  const holoCrisp = new Graphics();
  view.addChild(holoCrisp);

  // Scan line on blueprint
  const scan = new Graphics();
  view.addChild(scan);

  const tick = (t: number) => {
    // Emitter LED breath
    emit.clear();
    const ek = 0.6 + Math.sin(t * 2.4) * 0.3;
    emit.circle(emitCx - 14, emitCy, 1).fill({ color: accent, alpha: ek });
    emit.circle(emitCx + 14, emitCy, 1).fill({ color: accent, alpha: ek });

    // Holo cone above desk — soft upward triangle
    holo.clear();
    const apexY = -22;
    for (let r = 14; r > 0; r -= 2) {
      const a = (1 - r / 14) * 0.18;
      holo.ellipse(emitCx, apexY + 4, r * 1.6, r * 0.5).fill({ color: accent, alpha: a });
    }
    // Soft cone fill
    holo.poly([emitCx - 16, emitCy, emitCx + 16, emitCy, emitCx + 6, apexY, emitCx - 6, apexY])
      .fill({ color: accent, alpha: 0.07 });

    // Wireframe square rotating on Y-axis (project as horizontal scaling)
    holoCrisp.clear();
    const rot = t * 1.2;
    const sx = Math.cos(rot);
    const halfW = 12 * Math.abs(sx);
    const halfH = 8;
    const cy = apexY - 4;
    // Two vertical edges
    holoCrisp.moveTo(emitCx - halfW, cy - halfH).lineTo(emitCx - halfW, cy + halfH)
      .stroke({ color: accent, width: 0.8, alpha: 0.95 });
    holoCrisp.moveTo(emitCx + halfW, cy - halfH).lineTo(emitCx + halfW, cy + halfH)
      .stroke({ color: accent, width: 0.8, alpha: 0.95 });
    // Top + bottom (flatter ellipse to imply 3D)
    holoCrisp.moveTo(emitCx - halfW, cy - halfH).bezierCurveTo(
      emitCx - halfW * 0.4, cy - halfH - sx * 2,
      emitCx + halfW * 0.4, cy - halfH - sx * 2,
      emitCx + halfW, cy - halfH,
    ).stroke({ color: accent, width: 0.8, alpha: 0.85 });
    holoCrisp.moveTo(emitCx - halfW, cy + halfH).bezierCurveTo(
      emitCx - halfW * 0.4, cy + halfH + sx * 2,
      emitCx + halfW * 0.4, cy + halfH + sx * 2,
      emitCx + halfW, cy + halfH,
    ).stroke({ color: accent, width: 0.8, alpha: 0.85 });
    // Center core
    holoCrisp.circle(emitCx, cy, 1.2).fill({ color: accent });

    // Blueprint scan line
    scan.clear();
    const scanX = ((t * 12) % (w - 28)) + 14;
    scan.moveTo(scanX, 8).lineTo(scanX - 2, h - 10).stroke({ color: accent, width: 0.6, alpha: 0.6 });
  };

  return { view, tick };
}

// ═══════════════════ PARTS BIN WALL ═══════════════════
// Hex hopper bins on a peg-board. Each bin shows tiny "parts" inside,
// with a chute LED that pulses when a part is dispensed.

export function buildPartsBinWall(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): ForgeProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.forge;
  const cols = opts.cols ?? 2;
  const rows = opts.rows ?? 3;
  const view = new Container();

  // Backplate
  const board = new Graphics();
  board.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  board.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 0.8 });
  board.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.5 });
  // Peg dots
  for (let x = 4; x < w - 2; x += 4) {
    for (let y = 4; y < h - 2; y += 4) {
      board.circle(x, y, 0.3).fill({ color: PALETTE.steel500, alpha: 0.4 });
    }
  }
  view.addChild(board);

  // Hex bins
  const cellW = (w - 6) / cols;
  const cellH = (h - 6) / rows;
  const hexR = Math.min(cellW, cellH) * 0.42;

  const bins = new Graphics();
  view.addChild(bins);

  type Bin = { cx: number; cy: number; color: number; phase: number };
  const binData: Bin[] = [];
  const binColors = [PALETTE.warningGold, accent, PALETTE.scout, PALETTE.ok, PALETTE.steel300, PALETTE.warn];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = 3 + cellW * (c + 0.5);
      const cy = 3 + cellH * (r + 0.5);
      const idx = r * cols + c;
      binData.push({
        cx,
        cy,
        color: binColors[idx % binColors.length],
        phase: idx * 0.7,
      });
      // Hex outline (flat-top)
      const pts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        pts.push(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR);
      }
      bins.poly(pts).fill({ color: PALETTE.steel800 }).stroke({ color: PALETTE.charcoal, width: 0.8 });
      // Inner hex (parts compartment)
      const innerR = hexR - 2;
      const innerPts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        innerPts.push(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      }
      bins.poly(innerPts).fill({ color: PALETTE.charcoal });
      // Color band on top of hex
      bins.rect(cx - hexR * 0.6, cy - hexR + 1, hexR * 1.2, 1.5)
        .fill({ color: binData[idx].color, alpha: 0.85 });
    }
  }

  // Dynamic content: parts inside + LED pulse
  const dyn = new Graphics();
  view.addChild(dyn);

  const tick = (t: number) => {
    dyn.clear();
    for (const b of binData) {
      // Parts cluster (3-5 small dots) inside bin
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const r = hexR * 0.4;
        dyn.circle(b.cx + Math.cos(a) * r * 0.6, b.cy + Math.sin(a) * r * 0.6 + 1, 0.9)
          .fill({ color: b.color, alpha: 0.7 });
      }
      // Center stack
      dyn.circle(b.cx, b.cy + 1, 1.5).fill({ color: b.color, alpha: 0.85 });

      // LED at hex bottom — pulses when a part is "dispensed"
      const dispense = (Math.sin(t * 1.3 + b.phase) + 1) * 0.5;
      const ledOn = dispense > 0.85;
      dyn.circle(b.cx, b.cy + hexR - 1, 0.9)
        .fill({ color: ledOn ? PALETTE.warningGold : b.color, alpha: ledOn ? 1 : 0.5 });
      if (ledOn) {
        dyn.circle(b.cx, b.cy + hexR - 1, 2.5)
          .fill({ color: PALETTE.warningGold, alpha: 0.3 });
      }
    }
  };

  return { view, tick };
}

// ═══════════════════ FURNACE BAY ═══════════════════
// Wider furnace replacement. Body + dual chimneys + heat-shimmer band
// at door + intake conveyor strip on left side.

export function buildFurnaceBay(opts: {
  width: number;
  height: number;
  accent?: number;
}): ForgeProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.forge;
  const view = new Container();

  // Main body
  const body = new Graphics();
  body.rect(0, 0, w, h).fill({ color: PALETTE.steel800 });
  body.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  // Top bevel
  body.rect(1, 1, w - 2, 1.5).fill({ color: PALETTE.steel500, alpha: 0.7 });
  // Side flanges
  body.rect(0, 0, 4, h).fill({ color: PALETTE.steel700 });
  body.rect(w - 4, 0, 4, h).fill({ color: PALETTE.steel700 });
  // Bolt rivets
  for (let y = 6; y < h; y += 8) {
    body.circle(2, y, 0.7).fill({ color: PALETTE.steel400 });
    body.circle(w - 2, y, 0.7).fill({ color: PALETTE.steel400 });
  }
  // Furnace door (recessed)
  const doorY = h * 0.35;
  const doorH = h * 0.5;
  body.rect(8, doorY, w - 16, doorH).fill({ color: PALETTE.charcoal });
  body.rect(8, doorY, w - 16, doorH).stroke({ color: accent, width: 0.8, alpha: 0.85 });
  // Door bolts
  for (const [bx, by] of [[10, doorY + 2], [w - 10, doorY + 2], [10, doorY + doorH - 2], [w - 10, doorY + doorH - 2]] as const) {
    body.circle(bx, by, 0.8).fill({ color: PALETTE.steel400 });
  }
  // Intake conveyor at left
  body.rect(-12, h * 0.55, 16, 10).fill({ color: PALETTE.steel900 });
  body.rect(-12, h * 0.55, 16, 10).stroke({ color: PALETTE.steel500, width: 0.6 });
  view.addChild(body);

  // Dual chimney stubs
  const chim = new Graphics();
  chim.rect(w * 0.22 - 5, -8, 10, 8).fill({ color: PALETTE.steel700 });
  chim.rect(w * 0.22 - 5, -8, 10, 8).stroke({ color: PALETTE.charcoal, width: 0.6 });
  chim.rect(w * 0.78 - 5, -8, 10, 8).fill({ color: PALETTE.steel700 });
  chim.rect(w * 0.78 - 5, -8, 10, 8).stroke({ color: PALETTE.charcoal, width: 0.6 });
  // Chimney caps
  chim.rect(w * 0.22 - 7, -10, 14, 2).fill({ color: PALETTE.steel500 });
  chim.rect(w * 0.78 - 7, -10, 14, 2).fill({ color: PALETTE.steel500 });
  view.addChild(chim);

  // Heat glow inside door (additive)
  const glow = new Graphics();
  glow.blendMode = "add";
  glow.filters = [new BlurFilter({ strength: 6, quality: 3 })];
  view.addChild(glow);

  // Embers (small pool)
  const embers = new Graphics();
  embers.blendMode = "add";
  view.addChild(embers);
  type Ember = { x: number; y: number; vy: number; life: number; max: number };
  const emberPool: Ember[] = Array.from({ length: 14 }, () => ({
    x: 0, y: 0, vy: 0, life: 0, max: 1,
  }));
  let emberClock = 0;
  let tLast = 0;

  // Conveyor belt animation
  const belt = new Graphics();
  view.addChild(belt);

  // Smoke wisps from chimneys (additive)
  const smoke = new Graphics();
  smoke.blendMode = "add";
  smoke.filters = [new BlurFilter({ strength: 3, quality: 2 })];
  view.addChild(smoke);

  const tick = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, t - tLast));
    tLast = t;

    // Heat glow flicker
    glow.clear();
    const flick = 0.7 + Math.sin(t * 5) * 0.15 + Math.sin(t * 11) * 0.1;
    for (let r = 28; r > 0; r -= 3) {
      const a = (1 - r / 28) * 0.32 * flick;
      glow.ellipse(w / 2, doorY + doorH / 2, r * 1.6, r * 0.7).fill({ color: accent, alpha: a });
    }
    // Bright core band at door
    glow.rect(11, doorY + doorH / 2 - 4, w - 22, 8)
      .fill({ color: PALETTE.warningGold, alpha: 0.65 * flick });
    // Internal flame stripes
    for (let i = 0; i < 4; i++) {
      const sy = doorY + 4 + i * (doorH - 8) / 4;
      const so = Math.sin(t * 4 + i) * 2;
      glow.rect(12, sy + so, w - 24, 1).fill({ color: PALETTE.warningGold, alpha: 0.5 });
    }

    // Ember spawn (rises from door)
    emberClock += dt;
    while (emberClock > 0.12) {
      emberClock -= 0.12;
      const free = emberPool.find((e) => e.life <= 0);
      if (free) {
        free.x = w / 2 + (Math.random() - 0.5) * (w - 28);
        free.y = doorY + doorH - 4;
        free.vy = -10 - Math.random() * 18;
        free.max = 0.7 + Math.random() * 0.5;
        free.life = free.max;
      }
    }
    embers.clear();
    for (const e of emberPool) {
      if (e.life <= 0) continue;
      e.life -= dt;
      e.y += e.vy * dt;
      const a = Math.max(0, e.life / e.max);
      embers.circle(e.x, e.y, 0.7).fill({ color: PALETTE.warningGold, alpha: a });
      embers.circle(e.x, e.y, 1.6).fill({ color: accent, alpha: a * 0.4 });
    }

    // Conveyor belt drift
    belt.clear();
    const off = (t * 18) % 6;
    for (let x = -12 + off; x < 6; x += 6) {
      belt.rect(x, h * 0.55 + 2, 3, 1).fill({ color: accent, alpha: 0.6 });
      belt.rect(x, h * 0.55 + 6, 3, 1).fill({ color: accent, alpha: 0.4 });
    }

    // Chimney smoke
    smoke.clear();
    const smokePuffs = [
      { cx: w * 0.22, baseY: -10 },
      { cx: w * 0.78, baseY: -10 },
    ];
    for (const sp of smokePuffs) {
      for (let i = 0; i < 4; i++) {
        const py = sp.baseY - 4 - ((t * 14 + i * 8) % 28);
        const px = sp.cx + Math.sin(t * 0.8 + i) * 3;
        const a = Math.max(0, 0.35 - i * 0.07);
        smoke.circle(px, py, 3 + i * 0.6).fill({ color: PALETTE.steel300, alpha: a });
      }
    }
  };

  return { view, tick };
}

// ═══════════════════ GAS CYLINDER CLUSTER ═══════════════════
// Top-down cylinders with valve caps and color bands.

export function buildGasCylinderCluster(opts: {
  count?: number;
  spacing?: number;
  colors?: number[];
}): ForgeProp {
  const n = opts.count ?? 3;
  const spacing = opts.spacing ?? 11;
  const colors = opts.colors ?? [PALETTE.warn, PALETTE.scout, PALETTE.warningGold, PALETTE.ok];
  const view = new Container();

  const g = new Graphics();
  for (let i = 0; i < n; i++) {
    const cx = i * spacing;
    const cy = 0;
    const col = colors[i % colors.length];
    // Cylinder body
    g.circle(cx, cy, 5).fill({ color: PALETTE.steel700 });
    g.circle(cx, cy, 5).stroke({ color: PALETTE.charcoal, width: 0.6 });
    // Inner ring
    g.circle(cx, cy, 3.5).stroke({ color: PALETTE.steel500, width: 0.5 });
    // Color band (id ring)
    g.circle(cx, cy, 2).stroke({ color: col, width: 1.2, alpha: 0.9 });
    // Valve cap
    g.rect(cx - 1.4, cy - 1.4, 2.8, 2.8).fill({ color: PALETTE.steel400 });
    g.circle(cx, cy, 0.8).fill({ color: col });
  }
  view.addChild(g);

  // Subtle pressure-LED pulse
  const led = new Graphics();
  view.addChild(led);
  const tick = (t: number) => {
    led.clear();
    for (let i = 0; i < n; i++) {
      const cx = i * spacing;
      const a = 0.5 + Math.sin(t * 2 + i * 1.1) * 0.4;
      led.circle(cx + 4.2, -4.2, 0.6).fill({ color: PALETTE.ok, alpha: a });
    }
  };
  return { view, tick };
}

// ═══════════════════ ANVIL + WORKPIECE GLOW ═══════════════════
// Used as the strike target for the robotic arm. Returns a tick that
// pulses the workpiece glow when fed isStriking.

export interface AnvilProp extends ForgeProp {
  setStriking: (on: boolean) => void;
}

export function buildAnvil(opts: { accent?: number }): AnvilProp {
  const accent = opts.accent ?? PALETTE.forge;
  const view = new Container();

  // Anvil base + horn
  const g = new Graphics();
  // Foot
  g.rect(-16, 6, 32, 5).fill({ color: PALETTE.steel800 });
  g.rect(-16, 6, 32, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
  // Waist
  g.rect(-9, 0, 18, 6).fill({ color: PALETTE.steel700 });
  // Top + horn
  g.rect(-16, -6, 32, 6).fill({ color: PALETTE.steel500 });
  g.rect(-16, -6, 32, 1.5).fill({ color: PALETTE.steel200, alpha: 0.7 });
  g.poly([16, -6, 26, -3, 16, 0]).fill({ color: PALETTE.steel500 });
  // Hardy hole
  g.rect(-3, -5, 4, 3).fill({ color: PALETTE.charcoal });
  view.addChild(g);

  // Workpiece (small block on anvil)
  const work = new Graphics();
  work.rect(-4, -10, 8, 4).fill({ color: PALETTE.steel400 });
  view.addChild(work);

  // Heat halo
  const halo = new Graphics();
  halo.blendMode = "add";
  halo.filters = [new BlurFilter({ strength: 4, quality: 3 })];
  view.addChild(halo);

  let strikeBoost = 0;
  let striking = false;

  const tick = (t: number) => {
    if (striking) strikeBoost = Math.min(1, strikeBoost + 0.2);
    else strikeBoost = Math.max(0, strikeBoost - 0.05);

    halo.clear();
    const k = 0.5 + Math.abs(Math.sin(t * 2.3)) * 0.3 + strikeBoost * 0.6;
    for (let r = 14; r > 0; r -= 2) {
      const a = (1 - r / 14) * 0.22 * k;
      halo.circle(0, -8, r).fill({ color: PALETTE.warningGold, alpha: a });
    }
    // Workpiece flash recolor
    if (strikeBoost > 0.1) {
      work.clear();
      const mix = strikeBoost;
      const col = mix > 0.5 ? PALETTE.warningGold : accent;
      work.rect(-4, -10, 8, 4).fill({ color: col, alpha: 0.9 });
    } else {
      work.clear();
      work.rect(-4, -10, 8, 4).fill({ color: PALETTE.steel400 });
    }
  };

  return {
    view,
    tick,
    setStriking: (on) => { striking = on; },
  };
}
