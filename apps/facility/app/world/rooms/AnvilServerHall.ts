import { Container } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import {
  buildAisleArrow,
  buildFiberConduit,
  buildPatchPanel,
  buildRaidArray,
  buildTapeLibrary,
  buildThroughputBoard,
} from "../props/AnvilProps";
import {
  buildCableTray,
  buildCeilingVent,
  buildFloorNumber,
  buildGratingPanel,
  buildLabelTag,
  buildServerRack,
  buildWallPanel,
  buildWarningTriangle,
} from "../props/Greebles";

const ROOM_W = 520;
const ROOM_H = 340;

/**
 * Anvil Server Hall — v2.
 *
 * Cold-storage data center. Top: full-width throughput board with
 * 4 live bandwidth channels and TX/RX counters. Side walls: stacks of
 * tall server racks with LED storms. Center: top-down RAID array
 * (8 disks) with rotating activity sweeps. Lower-left: tape library
 * carousel with picker arm. Lower-right: 24-port patch panel with
 * cable nest. Ceiling: fiber conduit with optical pulses.
 */
export function drawAnvilServerHall(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.anvil,
    label: "Anvil Server Hall",
    labelCode: "AN-03",
    washIntensity: 0.42,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const add = <T extends { view: Container; tick: (t: number) => void }>(
    p: T, x: number, y: number,
  ) => { p.view.position.set(x, y); root.addChild(p.view); ticks.push(p.tick); return p; };

  // ─── Floor decals ───
  const floorNum = buildFloorNumber({ text: "03", accent: PALETTE.steel700 });
  floorNum.view.position.set(ROOM_W - 70, ROOM_H - 70);
  root.addChild(floorNum.view);

  // Cold/hot aisle arrows along central seam
  const aisleN = buildAisleArrow({ width: 64, text: "COLD AISLE", accent: PALETTE.scout, facing: "e" });
  aisleN.view.position.set(ROOM_W / 2 - 32, ROOM_H * 0.32);
  root.addChild(aisleN.view);
  const aisleS = buildAisleArrow({ width: 64, text: "HOT  AISLE", accent: PALETTE.warningGold, facing: "w" });
  aisleS.view.position.set(ROOM_W / 2 - 32, ROOM_H * 0.62);
  root.addChild(aisleS.view);

  // Floor grating panels along center vertical seam
  for (const gy of [70, 240]) {
    const g = buildGratingPanel({ width: 56, height: 32 });
    g.view.position.set(ROOM_W / 2 - 28, gy);
    g.view.alpha = 0.65;
    root.addChild(g.view);
  }

  // ─── Throughput board (top, full width minus padding) ───
  const tbW = ROOM_W - 60;
  const tbH = 50;
  add(buildThroughputBoard({ width: tbW, height: tbH, accent: PALETTE.anvil }), 30, 30);

  // ─── Server rack stacks (left + right walls, 2 racks each) ───
  add(buildServerRack({ width: 38, height: 130, accent: PALETTE.anvil }), 28, 92);
  add(buildServerRack({ width: 38, height: 130, accent: PALETTE.anvil }), 70, 92);
  add(buildServerRack({ width: 38, height: 130, accent: PALETTE.anvil }), ROOM_W - 28 - 38, 92);
  add(buildServerRack({ width: 38, height: 130, accent: PALETTE.anvil }), ROOM_W - 70 - 38, 92);

  // Rack row labels
  const lblL = buildLabelTag({ text: "RACK A1-A2", accent: PALETTE.anvil });
  lblL.view.position.set(28, 226);
  root.addChild(lblL.view);
  const lblR = buildLabelTag({ text: "RACK B1-B2", accent: PALETTE.anvil });
  lblR.view.position.set(ROOM_W - 90, 226);
  root.addChild(lblR.view);

  // ─── RAID array (center) ───
  const raidW = 156;
  const raidH = 60;
  add(
    buildRaidArray({ width: raidW, height: raidH, accent: PALETTE.anvil, cols: 4, rows: 2 }),
    (ROOM_W - raidW) / 2,
    ROOM_H / 2 - 22,
  );
  const raidLbl = buildLabelTag({ text: "RAID-Z3 // 64TB", accent: PALETTE.anvil });
  raidLbl.view.position.set(ROOM_W / 2 - 36, ROOM_H / 2 + 42);
  root.addChild(raidLbl.view);

  // ─── Tape library (lower-left) ───
  add(buildTapeLibrary({ radius: 28, accent: PALETTE.anvil, count: 12 }), 86, ROOM_H - 70);
  const tapeLbl = buildLabelTag({ text: "TAPE-LIB-01", accent: PALETTE.anvil });
  tapeLbl.view.position.set(58, ROOM_H - 32);
  root.addChild(tapeLbl.view);

  // ─── Patch panel (lower-right) ───
  const ppW = 122;
  const ppH = 58;
  add(buildPatchPanel({ width: ppW, height: ppH, accent: PALETTE.anvil, cols: 12, rows: 2 }),
    ROOM_W - 36 - ppW, ROOM_H - 90);
  const ppLbl = buildLabelTag({ text: "SW-CORE-01", accent: PALETTE.anvil });
  ppLbl.view.position.set(ROOM_W - 110, ROOM_H - 30);
  root.addChild(ppLbl.view);

  // ─── Auxiliary wall panels flanking RAID ───
  add(buildWallPanel({ width: 38, height: 26, accent: PALETTE.anvil, readout: "dots" }),
    ROOM_W / 2 - 110, ROOM_H / 2 - 8);
  add(buildWallPanel({ width: 38, height: 26, accent: PALETTE.anvil, readout: "bars" }),
    ROOM_W / 2 + 72, ROOM_H / 2 - 8);

  // ─── Ceiling fiber conduits (top, between racks and throughput board) ───
  add(buildFiberConduit({ length: 130, accent: PALETTE.scout, count: 3 }), 38, 86);
  add(buildFiberConduit({ length: 130, accent: PALETTE.scout, count: 3 }), ROOM_W - 168, 86);

  // ─── Cable trays running between rack rows and patch panel ───
  add(buildCableTray({ length: 80, axis: "vertical", accent: PALETTE.anvil, count: 4 }),
    150, ROOM_H - 130);
  add(buildCableTray({ length: 80, axis: "vertical", accent: PALETTE.anvil, count: 4 }),
    ROOM_W - 154, ROOM_H - 130);

  // ─── Ceiling vents ───
  const vent1 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.anvil });
  vent1.view.position.set(ROOM_W / 2 - 80, 88);
  root.addChild(vent1.view);
  ticks.push(vent1.tick);
  const vent2 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.anvil });
  vent2.view.position.set(ROOM_W / 2 + 50, 88);
  root.addChild(vent2.view);
  ticks.push(vent2.tick);

  // ─── Warning signage near tape & patch ───
  const wt1 = buildWarningTriangle({ size: 12 });
  wt1.view.position.set(170, ROOM_H - 60);
  wt1.view.alpha = 0.8;
  root.addChild(wt1.view);
  const wt2 = buildWarningTriangle({ size: 12 });
  wt2.view.position.set(ROOM_W - 184, ROOM_H - 60);
  wt2.view.alpha = 0.8;
  root.addChild(wt2.view);

  // ─── Corner tag ───
  const cornerTag = buildLabelTag({ text: "VAULT", accent: PALETTE.anvil });
  cornerTag.view.position.set(ROOM_W - 56, ROOM_H - 96);
  root.addChild(cornerTag.view);

  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);
  };

  return shell;
}
