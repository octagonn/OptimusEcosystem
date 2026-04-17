import { Container } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import {
  buildCentrifuge,
  buildDnaHelix,
  buildLabBench,
  buildMicroscopeStation,
  buildOscilloscope,
  buildPlasmaCore,
} from "../props/NovaProps";
import {
  buildCableTray,
  buildCeilingVent,
  buildFloodLight,
  buildFloorNumber,
  buildLabelTag,
  buildWallPanel,
  buildWarningTriangle,
} from "../props/Greebles";

const ROOM_W = 520;
const ROOM_H = 340;

/**
 * Nova Research Rig — v2.
 *
 * Experimental research bay. Top: oscilloscope with dual-channel waveform
 * + FFT spectrum. Center: plasma containment vessel with 3 mag-field
 * rings rotating around a pulsing plasma core. Left mid: high-speed
 * centrifuge with 6 sample tubes spinning. Right mid: rotating DNA
 * helix display. Bottom-left: lab bench with bubbling beakers and
 * Bunsen burner flame. Bottom-right: microscope + petri dish array
 * with drifting cell motion.
 */
export function drawNovaResearchRig(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.nova,
    label: "Nova Research Rig",
    labelCode: "NV-04",
    washIntensity: 0.55,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const add = <T extends { view: Container; tick: (t: number) => void }>(
    p: T, x: number, y: number,
  ) => { p.view.position.set(x, y); root.addChild(p.view); ticks.push(p.tick); return p; };

  // ─── Floor decals ───
  const floorNum = buildFloorNumber({ text: "04", accent: PALETTE.steel700 });
  floorNum.view.position.set(ROOM_W - 70, ROOM_H - 70);
  root.addChild(floorNum.view);

  // ─── Oscilloscope (top, wide) ───
  const oscW = ROOM_W - 80;
  const oscH = 60;
  add(buildOscilloscope({ width: oscW, height: oscH, accent: PALETTE.nova }), 40, 28);

  // ─── Plasma containment core (center) ───
  const cx = ROOM_W / 2;
  const cy = ROOM_H / 2 + 18;
  const core = buildPlasmaCore({ radius: 38, accent: PALETTE.nova });
  core.view.position.set(cx, cy);
  root.addChild(core.view);
  ticks.push(core.tick);

  const coreLbl = buildLabelTag({ text: "PLASMA-RX-1", accent: PALETTE.nova });
  coreLbl.view.position.set(cx - 28, cy + 50);
  root.addChild(coreLbl.view);

  // ─── Centrifuge (left mid) ───
  const cf = buildCentrifuge({ radius: 22, accent: PALETTE.nova });
  cf.view.position.set(74, ROOM_H * 0.5);
  root.addChild(cf.view);
  ticks.push(cf.tick);

  const cfLbl = buildLabelTag({ text: "CENTRIFUGE-A", accent: PALETTE.nova });
  cfLbl.view.position.set(46, ROOM_H * 0.5 + 38);
  root.addChild(cfLbl.view);

  // ─── DNA helix display (right mid) ───
  const dnaW = 100;
  const dnaH = 56;
  add(buildDnaHelix({ width: dnaW, height: dnaH, accent: PALETTE.nova }),
    ROOM_W - 36 - dnaW, ROOM_H * 0.5 - 28);

  // ─── Lab bench (bottom-left) ───
  add(buildLabBench({ width: 110, height: 50, accent: PALETTE.nova }), 30, ROOM_H - 64);

  // ─── Microscope station (bottom-right) ───
  add(buildMicroscopeStation({ width: 110, height: 46, accent: PALETTE.nova }),
    ROOM_W - 36 - 110, ROOM_H - 60);

  // ─── Auxiliary wall panels (mid-row, flanking core) ───
  add(buildWallPanel({ width: 36, height: 24, accent: PALETTE.nova, readout: "dots" }),
    cx - 90, cy - 14);
  add(buildWallPanel({ width: 36, height: 24, accent: PALETTE.nova, readout: "bars" }),
    cx + 54, cy - 14);

  // ─── Ceiling: cable trays + vents ───
  add(buildCableTray({ length: 90, axis: "horizontal", accent: PALETTE.nova, count: 4 }), 36, 92);
  add(buildCableTray({ length: 90, axis: "horizontal", accent: PALETTE.nova, count: 4 }),
    ROOM_W - 36 - 90, 92);

  const vent1 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.nova });
  vent1.view.position.set(ROOM_W / 2 - 70, 92);
  root.addChild(vent1.view);
  ticks.push(vent1.tick);
  const vent2 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.nova });
  vent2.view.position.set(ROOM_W / 2 + 40, 92);
  root.addChild(vent2.view);
  ticks.push(vent2.tick);

  add(buildFloodLight({ width: 26, accent: PALETTE.nova }), ROOM_W / 2 - 13, 92);

  // ─── Warning signage near plasma core ───
  const wt1 = buildWarningTriangle({ size: 12 });
  wt1.view.position.set(cx - 60, cy - 50);
  wt1.view.alpha = 0.85;
  root.addChild(wt1.view);
  const wt2 = buildWarningTriangle({ size: 12 });
  wt2.view.position.set(cx + 48, cy - 50);
  wt2.view.alpha = 0.85;
  root.addChild(wt2.view);

  // ─── Corner tag ───
  const cornerTag = buildLabelTag({ text: "RESEARCH", accent: PALETTE.nova });
  cornerTag.view.position.set(ROOM_W - 70, ROOM_H - 96);
  root.addChild(cornerTag.view);

  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);
  };

  return shell;
}
