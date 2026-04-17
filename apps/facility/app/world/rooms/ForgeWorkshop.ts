import { Container, Graphics, BlurFilter } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import {
  buildAnvil,
  buildBlueprintHoloDesk,
  buildFurnaceBay,
  buildGasCylinderCluster,
  buildPartsBinWall,
  buildRoboticArm,
} from "../props/ForgeProps";
import {
  buildBarrel,
  buildCableTray,
  buildCeilingVent,
  buildCrate,
  buildFloodLight,
  buildFloorNumber,
  buildHazardStrip,
  buildLabelTag,
  buildToolRack,
  buildWarningTriangle,
} from "../props/Greebles";

const ROOM_W = 520;
const ROOM_H = 340;

/**
 * Forge Workshop — v2.
 *
 * Fabrication floor. Top: wide furnace bay with intake conveyor +
 * dual chimney smoke. Center: articulated robotic arm doing pick/place
 * over a heated anvil — sparks burst on hammer-down. Left: blueprint
 * holo-desk projecting a rotating wireframe. Right: hex parts-bin wall
 * with dispensing LEDs. Lower flanks: tool peg-board walls + gas
 * cylinder clusters + barrels + crates.
 */
export function drawForgeWorkshop(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.forge,
    label: "Forge Workshop",
    labelCode: "FG-02",
    washIntensity: 0.6,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const add = <T extends { view: Container; tick: (t: number) => void }>(
    p: T, x: number, y: number,
  ) => { p.view.position.set(x, y); root.addChild(p.view); ticks.push(p.tick); return p; };

  // ─── Floor decals ───
  const floorNum = buildFloorNumber({ text: "02", accent: PALETTE.steel700 });
  floorNum.view.position.set(34, ROOM_H - 70);
  root.addChild(floorNum.view);

  // Hazard chevrons under the work zone (diagonal pair)
  const hsLeft = buildHazardStrip({ width: 12, height: 90, angle: -Math.PI / 2 });
  hsLeft.view.position.set(ROOM_W / 2 - 60, ROOM_H * 0.5 + 50);
  hsLeft.view.alpha = 0.35;
  root.addChild(hsLeft.view);
  const hsRight = buildHazardStrip({ width: 12, height: 90, angle: -Math.PI / 2 });
  hsRight.view.position.set(ROOM_W / 2 + 48, ROOM_H * 0.5 + 50);
  hsRight.view.alpha = 0.35;
  root.addChild(hsRight.view);

  // Floor safety circle around the anvil
  const safetyRing = new Graphics();
  const ax = ROOM_W / 2;
  const ay = ROOM_H * 0.55;
  for (let r = 56; r > 50; r -= 1) {
    safetyRing.circle(ax, ay + 12, r).stroke({ color: PALETTE.warningGold, width: 0.5, alpha: 0.18 });
  }
  // Inner solid ring
  safetyRing.circle(ax, ay + 12, 48).stroke({ color: PALETTE.warningGold, width: 1, alpha: 0.4 });
  // Tick marks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    safetyRing.moveTo(ax + Math.cos(a) * 50, ay + 12 + Math.sin(a) * 50)
      .lineTo(ax + Math.cos(a) * 54, ay + 12 + Math.sin(a) * 54)
      .stroke({ color: PALETTE.warningGold, width: 0.6, alpha: 0.6 });
  }
  root.addChild(safetyRing);

  // ─── Furnace bay (top center, wider) ───
  const furnW = 200;
  const furnH = 70;
  const furnX = (ROOM_W - furnW) / 2;
  const furnY = 30;
  add(buildFurnaceBay({ width: furnW, height: furnH, accent: PALETTE.forge }), furnX, furnY);

  // Cable trays running left and right from furnace into corners
  add(buildCableTray({ length: 96, axis: "horizontal", accent: PALETTE.forge, count: 3 }),
    furnX - 100, furnY + 10);
  add(buildCableTray({ length: 96, axis: "horizontal", accent: PALETTE.forge, count: 3 }),
    furnX + furnW + 4, furnY + 10);

  // Warning triangles flanking furnace
  const wt1 = buildWarningTriangle({ size: 14 });
  wt1.view.position.set(furnX - 22, furnY + 30);
  wt1.view.alpha = 0.85;
  root.addChild(wt1.view);
  const wt2 = buildWarningTriangle({ size: 14 });
  wt2.view.position.set(furnX + furnW + 8, furnY + 30);
  wt2.view.alpha = 0.85;
  root.addChild(wt2.view);

  const lblFurn = buildLabelTag({ text: "FURNACE-01", accent: PALETTE.forge });
  lblFurn.view.position.set(ROOM_W / 2 - 28, furnY + furnH + 4);
  root.addChild(lblFurn.view);

  // ─── Blueprint holo desk (left mid) ───
  const deskW = 100;
  const deskH = 56;
  add(buildBlueprintHoloDesk({ width: deskW, height: deskH, accent: PALETTE.forge }),
    32, ROOM_H * 0.42);

  const lblDesk = buildLabelTag({ text: "DRAFT-A", accent: PALETTE.forge });
  lblDesk.view.position.set(34, ROOM_H * 0.42 + deskH + 2);
  root.addChild(lblDesk.view);

  // ─── Parts bin wall (right mid) ───
  const binW = 64;
  const binH = 110;
  add(buildPartsBinWall({ width: binW, height: binH, accent: PALETTE.forge, cols: 2, rows: 3 }),
    ROOM_W - 32 - binW, ROOM_H * 0.34);

  const lblBins = buildLabelTag({ text: "PARTS BIN", accent: PALETTE.forge });
  lblBins.view.position.set(ROOM_W - 32 - binW, ROOM_H * 0.34 + binH + 2);
  root.addChild(lblBins.view);

  // ─── Anvil (center) ───
  const anvilProp = buildAnvil({ accent: PALETTE.forge });
  anvilProp.view.position.set(ax, ay);
  root.addChild(anvilProp.view);
  ticks.push(anvilProp.tick);

  const lblAnvil = buildLabelTag({ text: "ANVIL", accent: PALETTE.forge });
  lblAnvil.view.position.set(ax - 14, ay + 16);
  root.addChild(lblAnvil.view);

  // ─── Robotic arm (mounted just above anvil, swings down to it) ───
  const armProp = buildRoboticArm({
    accent: PALETTE.forge,
    upperLen: 36,
    lowerLen: 30,
    cycleSec: 3.2,
  });
  // Base sits on a small pedestal just above the anvil zone
  const armBaseX = ax;
  const armBaseY = ay - 50;
  armProp.view.position.set(armBaseX, armBaseY);
  root.addChild(armProp.view);
  ticks.push(armProp.tick);

  // Pedestal under arm
  const ped = new Graphics();
  ped.rect(armBaseX - 14, armBaseY + 10, 28, 8).fill({ color: PALETTE.steel800 });
  ped.rect(armBaseX - 14, armBaseY + 10, 28, 1).fill({ color: PALETTE.steel500, alpha: 0.7 });
  ped.rect(armBaseX - 14, armBaseY + 17, 28, 1).fill({ color: PALETTE.charcoal });
  root.addChild(ped);

  // ─── Tool rack walls (lower left + lower right) ───
  add(buildToolRack({ width: 44, height: 60, accent: PALETTE.forge }), 30, ROOM_H - 116);
  add(buildToolRack({ width: 44, height: 60, accent: PALETTE.forge }), ROOM_W - 74, ROOM_H - 116);

  // ─── Gas cylinder clusters (bottom corners) ───
  add(buildGasCylinderCluster({ count: 4, spacing: 11 }), 96, ROOM_H - 56);
  add(buildGasCylinderCluster({ count: 4, spacing: 11 }), ROOM_W - 96 - 33, ROOM_H - 56);

  // ─── Crates + barrels (lower flanks) ───
  add(buildCrate({ size: 16, accent: PALETTE.warningGold, label: "STL" }), 158, ROOM_H - 64);
  add(buildCrate({ size: 16, accent: PALETTE.forge, label: "ORD" }), 178, ROOM_H - 64);
  add(buildBarrel({ radius: 9, accent: PALETTE.warningGold }), 200, ROOM_H - 56);

  add(buildCrate({ size: 16, accent: PALETTE.warningGold }), ROOM_W - 178, ROOM_H - 64);
  add(buildCrate({ size: 16, accent: PALETTE.forge, label: "ALY" }), ROOM_W - 198, ROOM_H - 64);
  add(buildBarrel({ radius: 9, accent: PALETTE.forge }), ROOM_W - 220, ROOM_H - 56);

  // ─── Ceiling vents + flood lights (top) ───
  const vent1 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.forge });
  vent1.view.position.set(50, 20);
  root.addChild(vent1.view);
  ticks.push(vent1.tick);
  const vent2 = buildCeilingVent({ width: 30, height: 9, accent: PALETTE.forge });
  vent2.view.position.set(ROOM_W - 80, 20);
  root.addChild(vent2.view);
  ticks.push(vent2.tick);

  add(buildFloodLight({ width: 22, accent: PALETTE.warningGold }), 100, 24);
  add(buildFloodLight({ width: 22, accent: PALETTE.warningGold }), ROOM_W - 122, 24);

  // ─── Corner tag ───
  const cornerTag = buildLabelTag({ text: "FORGE", accent: PALETTE.forge });
  cornerTag.view.position.set(ROOM_W - 56, ROOM_H - 30);
  root.addChild(cornerTag.view);

  // ─── Spark pool driven by arm strikes on the anvil ───
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number };
  const sparkPool: Spark[] = Array.from({ length: 28 }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1,
  }));
  const sparkLayer = new Graphics();
  sparkLayer.blendMode = "add";
  sparkLayer.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  root.addChild(sparkLayer);

  let lastGripping = false;
  let tLastSpark = 0;

  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);

    // Detect strike (gripper arrived at anvil this frame)
    const grip = armProp.getGripperLocal();
    // Convert arm-local gripper to room-local
    const gx = armBaseX + grip.x;
    const gy = armBaseY + grip.y;
    const onAnvil = grip.gripping && Math.abs(gy - ay) < 20 && Math.abs(gx - ax) < 30;

    anvilProp.setStriking(onAnvil);

    if (onAnvil && !lastGripping) {
      // Spawn burst at gripper landing point
      for (let i = 0; i < 12; i++) {
        const s = sparkPool.find((sp) => sp.life <= 0);
        if (!s) break;
        const ang = -Math.PI + Math.random() * Math.PI;
        const speed = 26 + Math.random() * 38;
        s.x = gx + (Math.random() - 0.5) * 4;
        s.y = ay - 8;
        s.vx = Math.cos(ang) * speed;
        s.vy = Math.sin(ang) * speed;
        s.max = 0.45 + Math.random() * 0.35;
        s.life = s.max;
      }
    }
    lastGripping = onAnvil;

    // Update + render sparks
    const dt = Math.max(0, Math.min(0.1, t - tLastSpark));
    tLastSpark = t;
    sparkLayer.clear();
    for (const s of sparkPool) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 60 * dt;
      const a = Math.max(0, s.life / s.max);
      sparkLayer.circle(s.x, s.y, 1.2).fill({ color: PALETTE.warningGold, alpha: a });
      sparkLayer.circle(s.x, s.y, 2.6).fill({ color: PALETTE.forge, alpha: a * 0.4 });
    }
  };

  return shell;
}
