import { Container } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import {
  buildAntennaArray,
  buildContactBoard,
  buildFrequencyAnalyzer,
  buildRadarSweepWall,
  buildSatelliteUplink,
  buildTriangulationMap,
} from "../props/ScoutProps";
import {
  buildBeacon,
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
 * Scout Signals Bay — v2.
 *
 * SIGINT / reconnaissance bay. Top: triple-PPI radar sweep wall with
 * live blips. Center: triangulation map with three receiver stations
 * converging bearing lines on a moving geo-fix target. Left mid:
 * frequency spectrum analyzer. Right mid: contact register board.
 * Lower-left: antenna array (dishes + whips) on a truss. Lower-right:
 * satellite uplink with beam and orbital pulses.
 */
export function drawScoutSignalsBay(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.scout,
    label: "Scout Signals Bay",
    labelCode: "SC-06",
    washIntensity: 0.5,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const add = <T extends { view: Container; tick: (t: number) => void }>(
    p: T, x: number, y: number,
  ) => { p.view.position.set(x, y); root.addChild(p.view); ticks.push(p.tick); return p; };

  // ─── Floor decals ───
  const floorNum = buildFloorNumber({ text: "06", accent: PALETTE.steel700 });
  floorNum.view.position.set(ROOM_W - 70, ROOM_H - 70);
  root.addChild(floorNum.view);

  // ─── Radar sweep wall (top, full width) ───
  const rwW = ROOM_W - 60;
  const rwH = 72;
  add(buildRadarSweepWall({ width: rwW, height: rwH, accent: PALETTE.scout }), 30, 26);

  // ─── Triangulation map (center) ───
  const tmW = 180;
  const tmH = 104;
  add(buildTriangulationMap({ width: tmW, height: tmH, accent: PALETTE.scout }),
    (ROOM_W - tmW) / 2, ROOM_H / 2 - tmH / 2 + 6);

  const tmLbl = buildLabelTag({ text: "GEO-FIX TK-41", accent: PALETTE.scout });
  tmLbl.view.position.set(ROOM_W / 2 - 34, ROOM_H / 2 + 58);
  root.addChild(tmLbl.view);

  // ─── Frequency analyzer (left mid) ───
  add(buildFrequencyAnalyzer({ width: 120, height: 80, accent: PALETTE.scout }),
    28, ROOM_H / 2 - 40);

  // ─── Contact board (right mid) ───
  add(buildContactBoard({ width: 126, height: 92, accent: PALETTE.scout }),
    ROOM_W - 28 - 126, ROOM_H / 2 - 46);

  // ─── Antenna array (lower-left) ───
  add(buildAntennaArray({ width: 150, height: 56, accent: PALETTE.scout, count: 5 }),
    28, ROOM_H - 78);

  const aaLbl = buildLabelTag({ text: "ARRAY-ALPHA", accent: PALETTE.scout });
  aaLbl.view.position.set(34, ROOM_H - 20);
  root.addChild(aaLbl.view);

  // ─── Satellite uplink (lower-right) ───
  add(buildSatelliteUplink({ width: 150, height: 64, accent: PALETTE.scout }),
    ROOM_W - 28 - 150, ROOM_H - 86);

  const sulLbl = buildLabelTag({ text: "UPLINK-GEO-41", accent: PALETTE.scout });
  sulLbl.view.position.set(ROOM_W - 116, ROOM_H - 20);
  root.addChild(sulLbl.view);

  // ─── Wall panels flanking the triangulation map ───
  add(buildWallPanel({ width: 36, height: 26, accent: PALETTE.scout, readout: "dots" }),
    ROOM_W / 2 - 132, ROOM_H / 2 - 14);
  add(buildWallPanel({ width: 36, height: 26, accent: PALETTE.scout, readout: "bars" }),
    ROOM_W / 2 + 96, ROOM_H / 2 - 14);

  // ─── Ceiling cable trays & vents ───
  add(buildCableTray({ length: 100, axis: "horizontal", accent: PALETTE.scout, count: 4 }),
    36, 108);
  add(buildCableTray({ length: 100, axis: "horizontal", accent: PALETTE.scout, count: 4 }),
    ROOM_W - 36 - 100, 108);

  const vent1 = buildCeilingVent({ width: 26, height: 9, accent: PALETTE.scout });
  vent1.view.position.set(ROOM_W / 2 - 80, 108);
  root.addChild(vent1.view);
  ticks.push(vent1.tick);
  const vent2 = buildCeilingVent({ width: 26, height: 9, accent: PALETTE.scout });
  vent2.view.position.set(ROOM_W / 2 + 54, 108);
  root.addChild(vent2.view);
  ticks.push(vent2.tick);

  add(buildFloodLight({ width: 24, accent: PALETTE.scout }), ROOM_W / 2 - 12, 108);

  // ─── Signal beacons (corner hazards) ───
  add(buildBeacon({ radius: 4, accent: PALETTE.scout }), 38, ROOM_H / 2);
  add(buildBeacon({ radius: 4, accent: PALETTE.warningGold }), ROOM_W - 42, ROOM_H / 2);

  // ─── Warnings ───
  const wt1 = buildWarningTriangle({ size: 10 });
  wt1.view.position.set(ROOM_W / 2 - 100, ROOM_H / 2 - 38);
  wt1.view.alpha = 0.8;
  root.addChild(wt1.view);
  const wt2 = buildWarningTriangle({ size: 10 });
  wt2.view.position.set(ROOM_W / 2 + 88, ROOM_H / 2 - 38);
  wt2.view.alpha = 0.8;
  root.addChild(wt2.view);

  // ─── Corner tag ───
  const cornerTag = buildLabelTag({ text: "SIGINT", accent: PALETTE.scout });
  cornerTag.view.position.set(ROOM_W - 60, ROOM_H - 96);
  root.addChild(cornerTag.view);

  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);
  };

  return shell;
}
