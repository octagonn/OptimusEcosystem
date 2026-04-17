import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PALETTE } from "@/graphics/palette";

export interface PrimeProp {
  view: Container;
  tick: (t: number) => void;
}

/* ───────────────────────────────────────────────────────────────
 * Status Cell — one of the 6 cells in Prime's top monitor wall.
 * Shows a per-agent waveform + code label. Accent = target agent.
 * ─────────────────────────────────────────────────────────────── */
export function buildStatusCell(opts: {
  width: number;
  height: number;
  accent: number;
  code: string;
  phase: number;
}): PrimeProp {
  const { width: W, height: H, accent, code, phase } = opts;
  const view = new Container();

  // Panel chassis
  const panel = new Graphics();
  panel.roundRect(0, 0, W, H, 2).fill({ color: PALETTE.charcoal });
  panel.roundRect(0, 0, W, H, 2).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.8 });
  view.addChild(panel);

  // Accent top strip (LED bar)
  const ledStrip = new Graphics();
  ledStrip.rect(2, 2, W - 4, 2).fill({ color: accent, alpha: 0.9 });
  view.addChild(ledStrip);

  // Code label
  const label = new Text({
    text: code,
    style: new TextStyle({
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: 7,
      fontWeight: "700",
      letterSpacing: 1,
      fill: accent,
    }),
  });
  label.position.set(4, 6);
  view.addChild(label);

  // Waveform graphic (redraws per tick)
  const wave = new Graphics();
  view.addChild(wave);

  const plotY = H - 8;
  const plotH = H - 20;
  const sampleW = 2;
  const samples = Math.floor((W - 6) / sampleW);

  const drawWave = (t: number) => {
    wave.clear();
    for (let i = 0; i < samples; i++) {
      const x = 3 + i * sampleW;
      const localPhase = t * 3.6 + phase + i * 0.35;
      const h = (0.5 + 0.5 * Math.sin(localPhase)) * plotH * 0.85 + 1;
      wave.rect(x, plotY - h, sampleW - 1, h).fill({ color: accent, alpha: 0.75 });
    }
  };
  drawWave(0);

  return {
    view,
    tick: (t: number) => drawWave(t),
  };
}

/* ───────────────────────────────────────────────────────────────
 * Threat Ticker — scrolling LED text strip under the status wall.
 * Uses a graphics-based pseudo-LED font (5px dot grid per char).
 * ─────────────────────────────────────────────────────────────── */
export function buildThreatTicker(opts: {
  width: number;
  height: number;
  accent: number;
  text: string;
  speed?: number;
}): PrimeProp {
  const { width: W, height: H, accent, text } = opts;
  const speed = opts.speed ?? 32;
  const view = new Container();

  const panel = new Graphics();
  panel.rect(0, 0, W, H).fill({ color: PALETTE.charcoal });
  panel.rect(0, 0, W, H).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.7 });
  view.addChild(panel);

  // Mask so scrolling text stays inside the panel
  const mask = new Graphics();
  mask.rect(0, 0, W, H).fill({ color: 0xffffff });
  view.addChild(mask);

  const scroller = new Container();
  scroller.mask = mask;
  view.addChild(scroller);

  const style = new TextStyle({
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fill: accent,
  });

  // Double the text so scroll feels infinite
  const fullText = `${text}  ◆  ${text}  ◆  `;
  const t1 = new Text({ text: fullText, style });
  const t2 = new Text({ text: fullText, style });
  t1.position.set(0, (H - t1.height) / 2);
  t2.position.set(t1.width, (H - t2.height) / 2);
  scroller.addChild(t1);
  scroller.addChild(t2);

  const totalLen = t1.width;

  return {
    view,
    tick: (t: number) => {
      const offset = (t * speed) % totalLen;
      scroller.x = -offset;
    },
  };
}

/* ───────────────────────────────────────────────────────────────
 * Command Holo — Prime's signature central piece.
 * 6 orbital nodes (one per agent) with counter-rotating rings
 * and data-line traces that pulse between random pairs.
 * ─────────────────────────────────────────────────────────────── */
export function buildCommandHolo(opts: {
  radius: number;
  accent: number;
  nodeAccents: number[];  // 6 colors, one per agent
}): PrimeProp {
  const { radius: R, accent, nodeAccents } = opts;
  const view = new Container();

  // Base pedestal ring (static)
  const pedestal = new Graphics();
  pedestal.ellipse(0, 6, R + 6, 7).fill({ color: PALETTE.steel900 });
  pedestal.ellipse(0, 4, R + 2, 4).fill({ color: PALETTE.steel700 });
  pedestal.ellipse(0, 2, R - 2, 2).fill({ color: accent, alpha: 0.6 });
  view.addChild(pedestal);

  // Dome cap glow (static, additive)
  const dome = new Graphics();
  dome.blendMode = "add";
  for (let r = R; r > 0; r -= 4) {
    const a = (1 - r / R) * 0.08;
    dome.circle(0, 0, r).fill({ color: accent, alpha: a });
  }
  view.addChild(dome);

  // Outer rotating ring (drawn once, rotated each frame)
  const ringA = new Graphics();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const tickLen = i % 3 === 0 ? 4 : 2;
    const x1 = Math.cos(a) * R;
    const y1 = Math.sin(a) * R;
    const x2 = Math.cos(a) * (R - tickLen);
    const y2 = Math.sin(a) * (R - tickLen);
    ringA.moveTo(x1, y1).lineTo(x2, y2)
      .stroke({ color: accent, width: 1, alpha: 0.6 });
  }
  ringA.circle(0, 0, R).stroke({ color: accent, width: 0.8, alpha: 0.45 });
  view.addChild(ringA);

  // Middle ring (counter-rotating)
  const ringB = new Graphics();
  const rMid = R * 0.72;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ringB.circle(Math.cos(a) * rMid, Math.sin(a) * rMid, 0.8)
      .fill({ color: accent, alpha: 0.7 });
  }
  ringB.circle(0, 0, rMid).stroke({ color: accent, width: 0.5, alpha: 0.35 });
  view.addChild(ringB);

  // Agent orbital nodes (6)
  const nodeR = R * 0.56;
  const nodeLayer = new Container();
  view.addChild(nodeLayer);

  type Node = { g: Graphics; color: number; baseA: number; phase: number; x: number; y: number };
  const nodes: Node[] = [];
  for (let i = 0; i < 6; i++) {
    const baseA = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const color = nodeAccents[i] ?? accent;
    const g = new Graphics();
    nodeLayer.addChild(g);
    nodes.push({ g, color, baseA, phase: i * 0.6, x: 0, y: 0 });
  }

  // Data-line traces between random node pairs (pre-layer so traces sit under nodes)
  const traces = new Graphics();
  nodeLayer.addChildAt(traces, 0);

  // Active trace pool — 4 simultaneous
  type Trace = { from: number; to: number; life: number; dur: number };
  const tracePool: Trace[] = Array.from({ length: 4 }, () => ({ from: 0, to: 1, life: 0, dur: 0.7 }));
  const newTrace = (tr: Trace) => {
    tr.from = Math.floor(Math.random() * 6);
    do { tr.to = Math.floor(Math.random() * 6); } while (tr.to === tr.from);
    tr.dur = 0.6 + Math.random() * 0.6;
    tr.life = tr.dur;
  };
  for (const tr of tracePool) newTrace(tr);

  // Hex crosshair lines (static, always)
  const hair = new Graphics();
  hair.moveTo(-R, 0).lineTo(R, 0).stroke({ color: accent, width: 0.5, alpha: 0.25 });
  hair.moveTo(0, -R).lineTo(0, R).stroke({ color: accent, width: 0.5, alpha: 0.25 });
  view.addChildAt(hair, 2);

  let tLast = 0;

  return {
    view,
    tick: (t: number) => {
      const dt = Math.min(0.1, t - tLast);
      tLast = t;

      ringA.rotation = t * 0.25;
      ringB.rotation = -t * 0.18;

      // Redraw nodes w/ per-agent heartbeat pulse
      for (let i = 0; i < 6; i++) {
        const n = nodes[i];
        const beat = 0.7 + Math.abs(Math.sin(t * 1.2 + n.phase)) * 0.4;
        const a = n.baseA + t * 0.08; // slow co-rotation
        n.x = Math.cos(a) * nodeR;
        n.y = Math.sin(a) * nodeR;
        n.g.clear();
        // outer glow
        n.g.circle(n.x, n.y, 4.5 * beat).fill({ color: n.color, alpha: 0.35 });
        // core
        n.g.circle(n.x, n.y, 2.2).fill({ color: n.color, alpha: 1 });
        n.g.circle(n.x, n.y, 0.9).fill({ color: PALETTE.ivory });
      }

      // Redraw traces between random pairs
      traces.clear();
      for (const tr of tracePool) {
        tr.life -= dt;
        if (tr.life <= 0) newTrace(tr);
        const a = Math.min(1, tr.life / tr.dur);
        const k = Math.sin((1 - a) * Math.PI); // fade in-out
        const n1 = nodes[tr.from];
        const n2 = nodes[tr.to];
        traces.moveTo(n1.x, n1.y).lineTo(n2.x, n2.y)
          .stroke({ color: accent, width: 0.8, alpha: 0.55 * k });
        // moving pulse dot along the segment
        const pp = 1 - a;
        const px = n1.x + (n2.x - n1.x) * pp;
        const py = n1.y + (n2.y - n1.y) * pp;
        traces.circle(px, py, 1.8).fill({ color: PALETTE.ivory, alpha: k });
        traces.circle(px, py, 3.5).fill({ color: accent, alpha: 0.3 * k });
      }
    },
  };
}

/* ───────────────────────────────────────────────────────────────
 * Priority Stack — vertical column of N flags (R/A/G tri-state).
 * Each flag blinks on its own cycle to feel "live".
 * ─────────────────────────────────────────────────────────────── */
export function buildPriorityStack(opts: {
  width: number;
  height: number;
  accent: number;
  count: number;
}): PrimeProp {
  const { width: W, height: H, accent, count } = opts;
  const view = new Container();

  // Rack backplate
  const rack = new Graphics();
  rack.roundRect(0, 0, W, H, 2).fill({ color: PALETTE.charcoal });
  rack.roundRect(0, 0, W, H, 2).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.8 });
  view.addChild(rack);

  // Label bar at top
  const label = new Text({
    text: "PRIORITY",
    style: new TextStyle({
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: 6,
      fontWeight: "700",
      letterSpacing: 1.5,
      fill: accent,
    }),
  });
  label.position.set((W - label.width) / 2, 3);
  view.addChild(label);

  const flagY0 = 14;
  const flagH = (H - flagY0 - 4) / count;
  const flags: { g: Graphics; phase: number; states: number[] }[] = [];

  for (let i = 0; i < count; i++) {
    const y = flagY0 + i * flagH;
    const g = new Graphics();
    g.rect(3, y + 1, W - 6, flagH - 2).fill({ color: PALETTE.steel800 });
    g.rect(3, y + 1, W - 6, flagH - 2).stroke({ color: PALETTE.steel600, width: 0.5, alpha: 0.8 });
    view.addChild(g);

    // Tri-state LEDs (green/amber/red) — one lit at a time
    const ledG = new Graphics();
    view.addChild(ledG);
    flags.push({
      g: ledG,
      phase: i * 0.9,
      states: [PALETTE.ok, PALETTE.warn, PALETTE.danger],
    });

    // LED coords (horizontal, right-aligned inside flag)
    const ledCx = W - 7;
    const ledCy = y + flagH / 2;
    const drawAt = (colorIdx: number, alpha: number) => {
      ledG.clear();
      const color = flags[i].states[colorIdx];
      ledG.circle(ledCx, ledCy, 2).fill({ color, alpha });
      ledG.circle(ledCx, ledCy, 3.5).fill({ color, alpha: alpha * 0.35 });
    };
    drawAt(0, 1);

    // Per-flag small label
    const flagText = new Text({
      text: `P-0${i + 1}`,
      style: new TextStyle({
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 5.5,
        fill: PALETTE.steel100,
        letterSpacing: 0.5,
      }),
    });
    flagText.position.set(5, y + (flagH - flagText.height) / 2);
    view.addChild(flagText);
  }

  // Periodic state flip
  const tick = (t: number) => {
    for (let i = 0; i < count; i++) {
      const f = flags[i];
      // Deterministic "state" from time + phase
      const s = Math.floor(((t * 0.3 + f.phase) % 3));
      const blink = 0.8 + Math.abs(Math.sin((t + f.phase) * 6)) * 0.2;
      const color = f.states[s];
      const cy = flagY0 + i * flagH + flagH / 2;
      f.g.clear();
      f.g.circle(W - 7, cy, 2).fill({ color, alpha: blink });
      f.g.circle(W - 7, cy, 3.8).fill({ color, alpha: blink * 0.35 });
    }
  };
  return { view, tick };
}

/* ───────────────────────────────────────────────────────────────
 * Commander Podium — the wide central console Prime stands at.
 * Topped with a live waveform + status LEDs.
 * ─────────────────────────────────────────────────────────────── */
export function buildCommanderPodium(opts: {
  width: number;
  height: number;
  accent: number;
}): PrimeProp {
  const { width: W, height: H, accent } = opts;
  const view = new Container();

  // Base (trapezoidal-ish by using a wider bottom via overdraw)
  const base = new Graphics();
  base.rect(-4, H - 10, W + 8, 10).fill({ color: PALETTE.steel900 });
  base.rect(0, 0, W, H - 8).fill({ color: PALETTE.steel700 });
  base.rect(0, 0, W, H - 8).stroke({ color: PALETTE.steel500, width: 1, alpha: 0.8 });
  // Top bevel
  base.rect(0, 0, W, 2).fill({ color: PALETTE.steel300, alpha: 0.8 });
  view.addChild(base);

  // Accent strip along front edge
  const strip = new Graphics();
  strip.rect(4, H - 12, W - 8, 2).fill({ color: accent, alpha: 0.95 });
  view.addChild(strip);

  // Screen inset
  const screenX = 6;
  const screenY = 4;
  const screenW = W - 12;
  const screenH = H - 18;
  const screenBg = new Graphics();
  screenBg.rect(screenX, screenY, screenW, screenH).fill({ color: PALETTE.charcoal });
  screenBg.rect(screenX, screenY, screenW, screenH).stroke({ color: accent, width: 1, alpha: 0.7 });
  view.addChild(screenBg);

  // Waveform display
  const wave = new Graphics();
  view.addChild(wave);

  // Status LEDs on top-right of screen
  const leds: { g: Graphics; phase: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new Graphics();
    view.addChild(g);
    leds.push({ g, phase: i * 0.7 });
  }

  const drawAll = (t: number) => {
    // Waveform
    wave.clear();
    const midY = screenY + screenH / 2;
    const samples = Math.floor(screenW / 2);
    wave.moveTo(screenX, midY);
    for (let i = 0; i < samples; i++) {
      const x = screenX + i * 2;
      const y = midY + Math.sin(t * 8 + i * 0.42) * (screenH * 0.3)
        * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 0.08));
      wave.lineTo(x, y);
    }
    wave.stroke({ color: accent, width: 1.2, alpha: 0.95 });

    // LEDs
    for (let i = 0; i < leds.length; i++) {
      const l = leds[i];
      const on = Math.sin(t * 2.5 + l.phase) > 0;
      l.g.clear();
      const color = i === 0 ? PALETTE.ok : i === 1 ? PALETTE.warn : PALETTE.danger;
      const a = on ? 1 : 0.25;
      l.g.circle(screenX + screenW - 6 - i * 7, screenY + 6, 1.8).fill({ color, alpha: a });
      l.g.circle(screenX + screenW - 6 - i * 7, screenY + 6, 3.2).fill({ color, alpha: a * 0.3 });
    }
  };
  drawAll(0);

  return { view, tick: drawAll };
}
