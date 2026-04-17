import { Container, Graphics, Text, TextStyle, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface AnvilProp {
  view: Container;
  tick: (t: number) => void;
}

const noop = (_: number) => {};

// ═══════════════════ THROUGHPUT BOARD ═══════════════════
// Wide wall display: 4 stacked bandwidth bar charts with TX/RX numeric
// readouts. Uses a small set of Text instances (only digits change).

export function buildThroughputBoard(opts: {
  width: number;
  height: number;
  accent?: number;
}): AnvilProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.anvil;
  const view = new Container();

  const frame = new Graphics();
  frame.rect(0, 0, w, h).fill({ color: PALETTE.steel900 });
  frame.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  frame.rect(1, 1, w - 2, 1.5).fill({ color: PALETTE.steel500, alpha: 0.6 });
  // Title bar
  frame.rect(0, 0, w, 9).fill({ color: PALETTE.charcoal });
  frame.rect(0, 9, w, 0.8).fill({ color: accent, alpha: 0.85 });
  view.addChild(frame);

  const title = new Text({
    text: "ARRAY THROUGHPUT // COLD STORAGE 64TB / RUN 142h",
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 6,
      fill: accent,
      letterSpacing: 1,
    }),
  });
  title.position.set(4, 1.5);
  view.addChild(title);

  // Channels — each is a labeled mini-bar with rolling waveform
  const channels = ["DRV-A", "DRV-B", "DRV-C", "DRV-D"];
  const chH = (h - 14) / channels.length;
  const chBars: { y: number; phase: number }[] = [];

  const labels: Text[] = [];
  for (let i = 0; i < channels.length; i++) {
    const cy = 12 + i * chH;
    chBars.push({ y: cy, phase: i * 0.7 });
    // Track
    frame.rect(28, cy + 1, w - 60, chH - 2).fill({ color: PALETTE.charcoal });
    frame.rect(28, cy + 1, w - 60, chH - 2).stroke({ color: PALETTE.steel500, width: 0.4, alpha: 0.7 });
    // Label
    const lbl = new Text({
      text: channels[i],
      style: new TextStyle({
        fontFamily: "Consolas, monospace",
        fontSize: 5,
        fill: PALETTE.steel100,
        letterSpacing: 1,
      }),
    });
    lbl.position.set(4, cy + chH / 2 - 3);
    view.addChild(lbl);
    // Numeric readout placeholder
    const num = new Text({
      text: "000.0",
      style: new TextStyle({
        fontFamily: "Consolas, monospace",
        fontSize: 5,
        fill: accent,
        letterSpacing: 0.5,
      }),
    });
    num.position.set(w - 28, cy + chH / 2 - 3);
    labels.push(num);
    view.addChild(num);
  }

  // Dynamic bars + waveform layer
  const dyn = new Graphics();
  view.addChild(dyn);

  const tick = (t: number) => {
    dyn.clear();
    for (let i = 0; i < chBars.length; i++) {
      const c = chBars[i];
      const trackX = 28;
      const trackW = w - 60;
      const trackH = chH - 4;
      // Animated waveform inside track
      for (let x = 0; x < trackW; x += 1) {
        const v = (Math.sin(x * 0.18 + t * 2 + c.phase) * 0.5 + 0.5)
                * (Math.sin(x * 0.05 + t * 0.7) * 0.4 + 0.6);
        const bh = v * trackH;
        dyn.rect(trackX + x, c.y + chH - 2 - bh, 1, bh)
          .fill({ color: accent, alpha: 0.55 + v * 0.35 });
      }
      // Numeric update — pseudo MB/s
      const mbps = ((Math.sin(t * 0.8 + c.phase) * 0.5 + 0.5) * 480 + 20).toFixed(1);
      labels[i].text = mbps.padStart(5, "0");
    }
  };

  return { view, tick };
}

// ═══════════════════ RAID DISK ARRAY ═══════════════════
// Top-down view: hex grid of disks with rotating activity sweeps and
// per-disk status LEDs.

export function buildRaidArray(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): AnvilProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.anvil;
  const cols = opts.cols ?? 4;
  const rows = opts.rows ?? 2;
  const view = new Container();

  // Chassis
  const chassis = new Graphics();
  chassis.rect(0, 0, w, h).fill({ color: PALETTE.steel800 });
  chassis.rect(0, 0, w, h).stroke({ color: PALETTE.charcoal, width: 1 });
  chassis.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
  chassis.rect(0, h - 4, w, 4).fill({ color: PALETTE.steel900 });
  // Front rack ear screws
  for (const [x, y] of [[3, 3], [w - 3, 3], [3, h - 3], [w - 3, h - 3]] as const) {
    chassis.circle(x, y, 0.9).fill({ color: PALETTE.steel400 });
  }
  view.addChild(chassis);

  // Disk slots
  const cellW = (w - 8) / cols;
  const cellH = (h - 12) / rows;
  const diskR = Math.min(cellW, cellH) * 0.42;

  type Disk = { cx: number; cy: number; phase: number; speed: number; healthy: boolean };
  const disks: Disk[] = [];
  const slots = new Graphics();
  view.addChild(slots);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = 4 + cellW * (c + 0.5);
      const cy = 4 + cellH * (r + 0.5);
      slots.rect(cx - cellW * 0.45, cy - cellH * 0.45, cellW * 0.9, cellH * 0.9)
        .fill({ color: PALETTE.charcoal });
      slots.rect(cx - cellW * 0.45, cy - cellH * 0.45, cellW * 0.9, cellH * 0.9)
        .stroke({ color: PALETTE.steel500, width: 0.5, alpha: 0.7 });
      // Disk platter
      slots.circle(cx, cy, diskR).fill({ color: PALETTE.steel900 });
      slots.circle(cx, cy, diskR).stroke({ color: PALETTE.steel400, width: 0.4 });
      slots.circle(cx, cy, diskR * 0.85).stroke({ color: PALETTE.steel500, width: 0.3, alpha: 0.5 });
      // Spindle
      slots.circle(cx, cy, 1.2).fill({ color: PALETTE.steel400 });
      const idx = r * cols + c;
      disks.push({
        cx,
        cy,
        phase: idx * 0.4,
        speed: 1.5 + (idx % 3) * 0.4,
        healthy: idx % 7 !== 5,
      });
    }
  }

  // Dynamic activity sweep + LEDs
  const dyn = new Graphics();
  view.addChild(dyn);

  const tick = (t: number) => {
    dyn.clear();
    for (const d of disks) {
      // Activity sweep — small arc at one rotation point
      const ang = t * d.speed + d.phase;
      const sweepR = diskR - 1;
      const x1 = d.cx + Math.cos(ang) * sweepR;
      const y1 = d.cy + Math.sin(ang) * sweepR;
      const x2 = d.cx + Math.cos(ang + 0.6) * sweepR;
      const y2 = d.cy + Math.sin(ang + 0.6) * sweepR;
      dyn.moveTo(d.cx, d.cy).lineTo(x1, y1).stroke({
        color: d.healthy ? PALETTE.ok : PALETTE.warn,
        width: 0.8,
        alpha: 0.75,
      });
      dyn.moveTo(d.cx, d.cy).lineTo(x2, y2).stroke({
        color: d.healthy ? PALETTE.ok : PALETTE.warn,
        width: 0.6,
        alpha: 0.4,
      });
      // Status LED bottom-right of slot
      const ledOn = (Math.sin(t * 4 + d.phase) + 1) * 0.5;
      const col = !d.healthy ? PALETTE.warn : ledOn > 0.5 ? PALETTE.ok : PALETTE.steel500;
      dyn.circle(d.cx + diskR + 1, d.cy + diskR + 1, 0.7)
        .fill({ color: col, alpha: 0.8 });
    }
  };

  return { view, tick };
}

// ═══════════════════ TAPE LIBRARY ═══════════════════
// Circular cartridge carousel + a picker arm that swings to a slot,
// pauses to "extract", returns to home.

export function buildTapeLibrary(opts: {
  radius?: number;
  accent?: number;
  count?: number;
}): AnvilProp {
  const r = opts.radius ?? 28;
  const accent = opts.accent ?? PALETTE.anvil;
  const n = opts.count ?? 12;
  const view = new Container();

  // Backplate / housing
  const housing = new Graphics();
  housing.rect(-r - 6, -r - 6, (r + 6) * 2, (r + 6) * 2 + 4).fill({ color: PALETTE.steel800 });
  housing.rect(-r - 6, -r - 6, (r + 6) * 2, (r + 6) * 2 + 4)
    .stroke({ color: PALETTE.charcoal, width: 1 });
  housing.circle(0, 0, r + 3).fill({ color: PALETTE.steel900 });
  housing.circle(0, 0, r + 3).stroke({ color: accent, width: 0.6, alpha: 0.7 });
  view.addChild(housing);

  // Carousel disk (rotates slowly)
  const carousel = new Container();
  view.addChild(carousel);
  const car = new Graphics();
  carousel.addChild(car);

  // Tape cartridges around perimeter
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cx = Math.cos(a) * (r - 5);
    const cy = Math.sin(a) * (r - 5);
    // Tape (small rectangle tangent to ring)
    car.rect(cx - 3, cy - 2, 6, 4).fill({ color: PALETTE.steel700 });
    car.rect(cx - 3, cy - 2, 6, 4).stroke({ color: PALETTE.charcoal, width: 0.4 });
    // Color band on tape
    const band = i % 4 === 0 ? PALETTE.warn : i % 4 === 1 ? PALETTE.ok : i % 4 === 2 ? accent : PALETTE.warningGold;
    car.rect(cx - 3, cy - 2, 6, 0.7).fill({ color: band, alpha: 0.85 });
    // Label slot
    car.rect(cx - 2, cy + 0.5, 4, 0.5).fill({ color: PALETTE.steel400 });
  }
  // Center hub
  car.circle(0, 0, 4).fill({ color: PALETTE.steel500 });
  car.circle(0, 0, 4).stroke({ color: PALETTE.charcoal, width: 0.4 });
  car.circle(0, 0, 1).fill({ color: accent });

  // Picker arm overlay
  const arm = new Graphics();
  view.addChild(arm);

  // Footer LED strip
  const led = new Graphics();
  view.addChild(led);

  const tick = (t: number) => {
    // Slow carousel rotation
    carousel.rotation = t * 0.18;

    // Picker arm: swings to a target tape slot, dwells, returns
    arm.clear();
    const cyc = (t * 0.6) % (Math.PI * 2);
    const targetA = Math.floor(cyc / (Math.PI * 2 / n)) * (Math.PI * 2 / n);
    const dwell = (Math.sin(t * 4) + 1) * 0.5;
    const armR = (r - 4) - dwell * 4;
    const tx = Math.cos(targetA) * armR;
    const ty = Math.sin(targetA) * armR;
    // Arm shaft from outside edge inward
    const baseX = Math.cos(targetA) * (r + 2);
    const baseY = Math.sin(targetA) * (r + 2);
    arm.moveTo(baseX, baseY).lineTo(tx, ty).stroke({ color: PALETTE.steel300, width: 1.4 });
    arm.circle(tx, ty, 1.4).fill({ color: accent });
    arm.circle(tx, ty, 0.6).fill({ color: PALETTE.warningGold, alpha: 0.9 });

    // Status LEDs along bottom
    led.clear();
    for (let i = 0; i < 4; i++) {
      const lx = -9 + i * 6;
      const on = (Math.sin(t * 3 + i * 1.2) + 1) * 0.5 > 0.5;
      led.circle(lx, r + 5, 0.7).fill({
        color: on ? PALETTE.ok : PALETTE.steel500,
        alpha: on ? 0.95 : 0.6,
      });
    }
  };

  return { view, tick };
}

// ═══════════════════ PATCH PANEL ═══════════════════
// Network switch port grid with TX/RX link LEDs. Cable nest hangs below.

export function buildPatchPanel(opts: {
  width: number;
  height: number;
  accent?: number;
  cols?: number;
  rows?: number;
}): AnvilProp {
  const w = opts.width;
  const h = opts.height;
  const accent = opts.accent ?? PALETTE.anvil;
  const cols = opts.cols ?? 12;
  const rows = opts.rows ?? 2;
  const view = new Container();

  // Switch chassis
  const switchH = h * 0.55;
  const chassis = new Graphics();
  chassis.rect(0, 0, w, switchH).fill({ color: PALETTE.steel800 });
  chassis.rect(0, 0, w, switchH).stroke({ color: PALETTE.charcoal, width: 1 });
  chassis.rect(1, 1, w - 2, 1).fill({ color: PALETTE.steel500, alpha: 0.6 });
  // Brand strip
  chassis.rect(2, 2, w - 4, 4).fill({ color: PALETTE.charcoal });
  chassis.rect(2, 2, w - 4, 0.8).fill({ color: accent, alpha: 0.7 });
  view.addChild(chassis);

  // Port grid
  const ports = new Graphics();
  view.addChild(ports);
  const portStartY = 8;
  const portW = (w - 6) / cols;
  const portH = (switchH - portStartY - 4) / rows;
  type Port = { x: number; y: number; phase: number; linked: boolean };
  const portData: Port[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = 3 + c * portW;
      const py = portStartY + r * portH;
      ports.rect(px, py, portW - 1, portH - 1).fill({ color: PALETTE.charcoal });
      ports.rect(px, py, portW - 1, portH - 1).stroke({ color: PALETTE.steel500, width: 0.3, alpha: 0.7 });
      // RJ45 socket suggestion
      ports.rect(px + 1, py + 1, portW - 3, portH - 3).fill({ color: PALETTE.steel900 });
      const idx = r * cols + c;
      portData.push({
        x: px + portW / 2,
        y: py + portH / 2,
        phase: idx * 0.4,
        linked: idx % 5 !== 4,
      });
    }
  }

  // Cable nest below switch (curved bezier strands)
  const cables = new Graphics();
  view.addChild(cables);
  const colors = [accent, PALETTE.warningGold, PALETTE.ok, PALETTE.warn, PALETTE.scout, PALETTE.steel300];
  for (let i = 0; i < 12; i++) {
    const px = 4 + i * (w / 12);
    const ex = 4 + ((i + 6) * 13) % w;
    const dropY = switchH + 4 + (i % 4) * 6;
    cables.moveTo(px, switchH).bezierCurveTo(
      px, switchH + 18, ex, switchH + 24, ex, dropY,
    ).stroke({ color: colors[i % colors.length], width: 0.7, alpha: 0.55 });
  }

  // Dynamic LEDs
  const leds = new Graphics();
  view.addChild(leds);
  const tick = (t: number) => {
    leds.clear();
    for (const p of portData) {
      if (!p.linked) continue;
      const blink = (Math.sin(t * 6 + p.phase) + 1) * 0.5;
      const on = blink > 0.4;
      leds.circle(p.x - 1.5, p.y - 0.5, 0.5)
        .fill({ color: PALETTE.ok, alpha: on ? 1 : 0.3 });
      leds.circle(p.x + 1.5, p.y - 0.5, 0.5)
        .fill({ color: PALETTE.warningGold, alpha: blink > 0.7 ? 1 : 0.2 });
    }
  };
  return { view, tick };
}

// ═══════════════════ FIBER CONDUIT ═══════════════════
// Ceiling-mount fiber tube with flowing optical pulses (similar
// to corridor seam but compact).

export function buildFiberConduit(opts: {
  length: number;
  accent?: number;
  count?: number;
}): AnvilProp {
  const L = opts.length;
  const accent = opts.accent ?? PALETTE.scout;
  const count = opts.count ?? 3;
  const view = new Container();

  const thick = count * 1.5 + 4;
  const base = new Graphics();
  base.rect(0, 0, L, thick).fill({ color: PALETTE.steel900 });
  base.rect(0, 0, L, thick).stroke({ color: PALETTE.charcoal, width: 0.6 });
  base.rect(0, 0, L, 0.8).fill({ color: PALETTE.steel500, alpha: 0.5 });
  // Hangers every 30px
  for (let x = 8; x < L - 4; x += 30) {
    base.rect(x, -3, 1.5, 3).fill({ color: PALETTE.steel400 });
  }
  view.addChild(base);

  // Pulse layer (additive)
  const pulse = new Graphics();
  pulse.blendMode = "add";
  pulse.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  view.addChild(pulse);

  const tick = (t: number) => {
    pulse.clear();
    for (let i = 0; i < count; i++) {
      const y = 2 + i * 1.5;
      const speed = 60 + i * 14;
      const off = (t * speed + i * 12) % (L + 24) - 12;
      const col = i === 0 ? accent : i === 1 ? PALETTE.ok : PALETTE.warningGold;
      pulse.rect(off, y, 16, 0.9).fill({ color: col, alpha: 0.85 });
      pulse.rect(off, y, 16, 0.9).fill({ color: col, alpha: 0.25 });
    }
  };
  return { view, tick };
}

// ═══════════════════ AISLE ARROW DECAL ═══════════════════

export function buildAisleArrow(opts: {
  width?: number;
  text?: string;
  accent?: number;
  facing?: "n" | "s" | "e" | "w";
}): AnvilProp {
  const w = opts.width ?? 60;
  const text = opts.text ?? "COLD AISLE";
  const accent = opts.accent ?? PALETTE.scout;
  const facing = opts.facing ?? "e";
  const view = new Container();

  const g = new Graphics();
  g.rect(0, 0, w, 12).fill({ color: PALETTE.charcoal, alpha: 0.5 });
  g.rect(0, 0, w, 1).fill({ color: accent, alpha: 0.6 });
  g.rect(0, 11, w, 1).fill({ color: accent, alpha: 0.6 });
  // Arrow
  const arrowX = facing === "e" ? w - 8 : facing === "w" ? 6 : w / 2;
  const arrowY = 6;
  if (facing === "e") {
    g.poly([arrowX - 4, arrowY - 3, arrowX + 2, arrowY, arrowX - 4, arrowY + 3])
      .fill({ color: accent, alpha: 0.8 });
  } else if (facing === "w") {
    g.poly([arrowX + 4, arrowY - 3, arrowX - 2, arrowY, arrowX + 4, arrowY + 3])
      .fill({ color: accent, alpha: 0.8 });
  } else if (facing === "n") {
    g.poly([arrowX - 3, arrowY + 2, arrowX, arrowY - 4, arrowX + 3, arrowY + 2])
      .fill({ color: accent, alpha: 0.8 });
  } else {
    g.poly([arrowX - 3, arrowY - 2, arrowX, arrowY + 4, arrowX + 3, arrowY - 2])
      .fill({ color: accent, alpha: 0.8 });
  }
  view.addChild(g);

  const t = new Text({
    text,
    style: new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 5,
      fill: accent,
      letterSpacing: 1,
    }),
  });
  t.position.set(facing === "e" ? 4 : 12, 3);
  view.addChild(t);

  view.alpha = 0.6;
  return { view, tick: noop };
}
