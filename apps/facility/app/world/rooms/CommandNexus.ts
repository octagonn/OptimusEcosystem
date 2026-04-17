import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import {
  buildCableTray,
  buildCeilingVent,
  buildFloorNumber,
  buildLabelTag,
} from "../props/Greebles";
import {
  buildCommandHolo,
  buildCommanderPodium,
  buildPriorityStack,
  buildStatusCell,
  buildThreatTicker,
} from "../props/PrimeProps";

const ROOM_W = 520;
const ROOM_H = 340;

// Agent accents in display order (status wall + holo orbital nodes)
const AGENT_ACCENTS = [
  PALETTE.prime,
  PALETTE.forge,
  PALETTE.anvil,
  PALETTE.nova,
  PALETTE.lore,
  PALETTE.scout,
];
const AGENT_CODES = ["NX-01", "FG-02", "AN-03", "NV-04", "LR-05", "SC-06"];

/**
 * Command Nexus (Prime) — v2.
 *
 * War-room bridge. Top status wall monitors all 6 agents, central
 * holo-globe shows them as orbital nodes with live data-line pulses,
 * priority flag stacks on either side, and a wide commander podium
 * at the bottom where Prime stands.
 */
export function drawCommandNexus(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.prime,
    label: "Command Nexus",
    labelCode: "NX-01",
    washIntensity: 0.55,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const addTicked = (p: { view: Container; tick: (t: number) => void }, x: number, y: number) => {
    p.view.position.set(x, y);
    root.addChild(p.view);
    ticks.push(p.tick);
    return p;
  };

  // ─── Upper band — 6-segment status wall ───
  const cellsStartX = 36;
  const cellsEndX = ROOM_W - 36;
  const cellCount = 6;
  const cellGap = 4;
  const cellsTotalW = cellsEndX - cellsStartX;
  const cellW = (cellsTotalW - cellGap * (cellCount - 1)) / cellCount;
  const cellH = 34;
  const cellY = 32;
  for (let i = 0; i < cellCount; i++) {
    const x = cellsStartX + i * (cellW + cellGap);
    addTicked(
      buildStatusCell({
        width: cellW,
        height: cellH,
        accent: AGENT_ACCENTS[i],
        code: AGENT_CODES[i],
        phase: i * 0.9,
      }),
      x,
      cellY,
    );
  }

  // ─── Threat ticker ───
  addTicked(
    buildThreatTicker({
      width: cellsEndX - cellsStartX,
      height: 16,
      accent: PALETTE.prime,
      text: "SECTOR OMEGA — CLEARANCE 5 — QUEUE 012 PENDING — UPTIME 1474:23 — THREAT LEVEL: BLUE — DISPATCH ACTIVE",
      speed: 32,
    }),
    cellsStartX,
    72,
  );

  // ─── Side priority stacks ───
  addTicked(
    buildPriorityStack({ width: 34, height: 150, accent: PALETTE.prime, count: 4 }),
    22,
    110,
  );
  addTicked(
    buildPriorityStack({ width: 34, height: 150, accent: PALETTE.prime, count: 4 }),
    ROOM_W - 22 - 34,
    110,
  );

  // ─── Floor command-ring inlay (static Graphics under the holo) ───
  const floorInlay = new Graphics();
  const cx = ROOM_W / 2;
  const cy = ROOM_H / 2 + 8;
  for (let rr = 90; rr > 50; rr -= 10) {
    floorInlay.circle(cx, cy, rr).stroke({ color: PALETTE.prime, width: 1, alpha: 0.12 });
  }
  floorInlay.circle(cx, cy, 74).stroke({ color: PALETTE.prime, width: 1.5, alpha: 0.25 });
  // command arrows pointing N/S/E/W
  const arrow = (ax: number, ay: number, rot: number) => {
    floorInlay
      .moveTo(ax - 4, ay + 2)
      .lineTo(ax, ay - 3)
      .lineTo(ax + 4, ay + 2)
      .stroke({ color: PALETTE.prime, width: 1, alpha: 0.35 });
    // rot unused — we hand-position each arrow
    void rot;
  };
  arrow(cx, cy - 78, 0);
  arrow(cx, cy + 78, Math.PI);
  root.addChild(floorInlay);

  // ─── Central command holo ───
  const holo = buildCommandHolo({
    radius: 44,
    accent: PALETTE.prime,
    nodeAccents: AGENT_ACCENTS,
  });
  addTicked(holo, cx, cy);

  // ─── Data-packet motes ascending from the holo ───
  // Hand-rolled pool (30 max). Upward cone, fade from white → prime red.
  const particleLayer = new Graphics();
  particleLayer.blendMode = "add";
  particleLayer.position.set(cx, cy);
  root.addChild(particleLayer);

  type Mote = { x: number; y: number; vx: number; vy: number; life: number; max: number };
  const motes: Mote[] = Array.from({ length: 30 }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1,
  }));
  let spawnClock = 0;
  let tLastP = 0;
  const spawnMote = (m: Mote) => {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.7; // upward cone
    const spd = 18 + Math.random() * 20;
    const startAng = Math.random() * Math.PI * 2;
    const startR = 10 + Math.random() * 28;
    m.x = Math.cos(startAng) * startR;
    m.y = Math.sin(startAng) * startR * 0.5 - 4;
    m.vx = Math.cos(ang) * spd * (0.3 + Math.random() * 0.3);
    m.vy = Math.sin(ang) * spd;
    m.max = 0.9 + Math.random() * 0.7;
    m.life = m.max;
  };

  ticks.push((t: number) => {
    const dt = Math.max(0, Math.min(0.1, t - tLastP));
    tLastP = t;
    spawnClock += dt;
    while (spawnClock > 0.1) {
      spawnClock -= 0.1;
      const free = motes.find((m) => m.life <= 0);
      if (free) spawnMote(free);
    }
    particleLayer.clear();
    for (const m of motes) {
      if (m.life <= 0) continue;
      m.life -= dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const a = Math.max(0, m.life / m.max);
      // color shift white → prime red over life
      const mix = 1 - a;
      const r = Math.round(255 * (1 - mix) + 193 * mix);
      const g = Math.round(255 * (1 - mix) + 18 * mix);
      const b = Math.round(255 * (1 - mix) + 31 * mix);
      const color = (r << 16) | (g << 8) | b;
      const size = 0.8 + a * 1.2;
      particleLayer.circle(m.x, m.y, size).fill({ color, alpha: a * 0.9 });
      particleLayer.circle(m.x, m.y, size * 2.2).fill({ color, alpha: a * 0.18 });
    }
  });

  // ─── Commander podium (central, lower) ───
  const podiumW = 96;
  const podiumH = 34;
  addTicked(
    buildCommanderPodium({ width: podiumW, height: podiumH, accent: PALETTE.prime }),
    cx - podiumW / 2,
    ROOM_H - 76,
  );

  // ─── Dispatch LED clusters (flanking the podium) ───
  const dispatchCluster = (x: number, y: number) => {
    const g = new Graphics();
    const label = new Text({
      text: "DISPATCH",
      style: new TextStyle({
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 6,
        fontWeight: "700",
        letterSpacing: 1,
        fill: PALETTE.prime,
      }),
    });
    label.position.set(x, y);
    root.addChild(label);
    root.addChild(g);
    const leds = [
      { color: PALETTE.ok, phase: 0 },
      { color: PALETTE.warn, phase: 0.5 },
      { color: PALETTE.danger, phase: 1.1 },
      { color: PALETTE.hologramTeal, phase: 1.7 },
      { color: PALETTE.warningGold, phase: 2.3 },
      { color: PALETTE.prime, phase: 2.9 },
    ];
    ticks.push((t: number) => {
      g.clear();
      for (let i = 0; i < leds.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const ledX = x + 4 + col * 8;
        const ledY = y + 12 + row * 7;
        const on = Math.sin(t * 2 + leds[i].phase) > -0.2;
        const alpha = on ? 1 : 0.25;
        g.circle(ledX, ledY, 1.8).fill({ color: leds[i].color, alpha });
        g.circle(ledX, ledY, 3.2).fill({ color: leds[i].color, alpha: alpha * 0.3 });
      }
    });
  };
  dispatchCluster(72, ROOM_H - 76);
  dispatchCluster(ROOM_W - 72 - 30, ROOM_H - 76);

  // ─── Ceiling vents (static greebles) ───
  const vent1 = buildCeilingVent({ width: 32, height: 10, accent: PALETTE.prime });
  vent1.view.position.set(100, 22);
  root.addChild(vent1.view);
  const vent2 = buildCeilingVent({ width: 32, height: 10, accent: PALETTE.prime });
  vent2.view.position.set(ROOM_W - 132, 22);
  root.addChild(vent2.view);

  // ─── Cable tray spanning above podium ───
  const tray = buildCableTray({ length: 180, axis: "horizontal", accent: PALETTE.prime, count: 4 });
  tray.view.position.set(cx - 90, ROOM_H - 98);
  root.addChild(tray.view);
  ticks.push(tray.tick);

  // ─── Corner tag + floor number ───
  const floorNum = buildFloorNumber({ text: "01", accent: PALETTE.steel700 });
  floorNum.view.position.set(30, ROOM_H - 64);
  root.addChild(floorNum.view);

  const cornerTag = buildLabelTag({ text: "NEXUS", accent: PALETTE.prime });
  cornerTag.view.position.set(ROOM_W - 60, ROOM_H - 32);
  root.addChild(cornerTag.view);

  // ── Merge shell tick + all prop ticks ──
  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);
  };

  return shell;
}
