import { Container } from "pixi.js";
import { PALETTE } from "@/graphics/palette";
import { createRoomShell, type RoomShell } from "./RoomShell";
import { buildBookshelf } from "../props/Bookshelf";
import {
  buildAncientCodex,
  buildArchiveIndexTicker,
  buildCardCatalog,
  buildLibrarianDesk,
  buildScrollTubeWall,
} from "../props/LoreProps";
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
 * Lore Archive — v2.
 *
 * Top + side walls lined with bookshelves. Center: illuminated ancient
 * codex on a lectern with orbiting glyph particles and page-flip
 * animation. Lower-left: librarian desk with candle, quill, parchment.
 * Lower-right: card catalog drawer grid + scroll tube cubbies.
 * Bottom: archive index ticker scrolling book titles.
 */
export function drawLoreArchive(): RoomShell {
  const shell = createRoomShell({
    width: ROOM_W,
    height: ROOM_H,
    accent: PALETTE.lore,
    label: "Lore Archive",
    labelCode: "LR-05",
    washIntensity: 0.45,
  });
  const root = shell.inner;
  const ticks: ((t: number) => void)[] = [];
  const add = <T extends { view: Container; tick: (t: number) => void }>(
    p: T, x: number, y: number,
  ) => { p.view.position.set(x, y); root.addChild(p.view); ticks.push(p.tick); return p; };

  // ─── Floor decals ───
  const floorNum = buildFloorNumber({ text: "05", accent: PALETTE.steel700 });
  floorNum.view.position.set(ROOM_W - 70, ROOM_H - 70);
  root.addChild(floorNum.view);

  // ─── Top-wall bookshelves (twin wide) ───
  add(buildBookshelf({ width: 200, height: 44, accent: PALETTE.lore, rows: 2 }), 30, 32);
  add(buildBookshelf({ width: 200, height: 44, accent: PALETTE.lore, rows: 2 }),
    ROOM_W - 30 - 200, 32);

  // ─── Side-wall bookshelves (tall, flanking center) ───
  add(buildBookshelf({ width: 32, height: 140, accent: PALETTE.lore, rows: 5 }), 26, 92);
  add(buildBookshelf({ width: 32, height: 140, accent: PALETTE.lore, rows: 5 }),
    ROOM_W - 26 - 32, 92);

  // ─── Ancient codex (center) ───
  const cx = ROOM_W / 2;
  const cy = ROOM_H / 2 + 6;
  const codex = buildAncientCodex({ width: 96, accent: PALETTE.lore });
  codex.view.position.set(cx, cy - 10);
  root.addChild(codex.view);
  ticks.push(codex.tick);

  const codexLbl = buildLabelTag({ text: "CODEX-PRIME", accent: PALETTE.lore });
  codexLbl.view.position.set(cx - 32, cy + 40);
  root.addChild(codexLbl.view);

  // ─── Librarian desk (lower-left) ───
  add(buildLibrarianDesk({ width: 126, height: 58, accent: PALETTE.lore }),
    28, ROOM_H - 108);

  const deskLbl = buildLabelTag({ text: "LIBRARIAN", accent: PALETTE.lore });
  deskLbl.view.position.set(36, ROOM_H - 44);
  root.addChild(deskLbl.view);

  // ─── Card catalog (lower-right) ───
  add(buildCardCatalog({ width: 110, height: 64, accent: PALETTE.lore, cols: 4, rows: 3 }),
    ROOM_W - 28 - 110, ROOM_H - 112);

  const catLbl = buildLabelTag({ text: "INDEX A-Z", accent: PALETTE.lore });
  catLbl.view.position.set(ROOM_W - 94, ROOM_H - 44);
  root.addChild(catLbl.view);

  // ─── Scroll tube wall (mid-right, above catalog) ───
  add(buildScrollTubeWall({ width: 90, height: 46, accent: PALETTE.lore, cols: 5, rows: 2 }),
    ROOM_W - 28 - 90, 96);

  // ─── Archive index ticker (bottom center) ───
  add(buildArchiveIndexTicker({ width: 220, height: 22, accent: PALETTE.lore }),
    (ROOM_W - 220) / 2, ROOM_H - 38);

  // ─── Reading alcove panels flanking codex ───
  add(buildWallPanel({ width: 40, height: 26, accent: PALETTE.lore, readout: "dots" }),
    cx - 110, cy - 14);
  add(buildWallPanel({ width: 40, height: 26, accent: PALETTE.lore, readout: "bars" }),
    cx + 70, cy - 14);

  // ─── Ceiling: cable trays + vent + warm lamp ───
  add(buildCableTray({ length: 120, axis: "horizontal", accent: PALETTE.lore, count: 3 }),
    cx - 60, 84);

  const vent1 = buildCeilingVent({ width: 26, height: 9, accent: PALETTE.lore });
  vent1.view.position.set(cx - 80, 84);
  root.addChild(vent1.view);
  ticks.push(vent1.tick);
  const vent2 = buildCeilingVent({ width: 26, height: 9, accent: PALETTE.lore });
  vent2.view.position.set(cx + 54, 84);
  root.addChild(vent2.view);
  ticks.push(vent2.tick);

  add(buildFloodLight({ width: 24, accent: PALETTE.warningGold }), cx - 12, 84);

  // ─── Ambient warnings (subtle, at the archive entries) ───
  const wt1 = buildWarningTriangle({ size: 10 });
  wt1.view.position.set(cx - 90, cy - 56);
  wt1.view.alpha = 0.6;
  root.addChild(wt1.view);
  const wt2 = buildWarningTriangle({ size: 10 });
  wt2.view.position.set(cx + 80, cy - 56);
  wt2.view.alpha = 0.6;
  root.addChild(wt2.view);

  // ─── Corner tag ───
  const cornerTag = buildLabelTag({ text: "ARCHIVE", accent: PALETTE.lore });
  cornerTag.view.position.set(ROOM_W - 70, ROOM_H - 96);
  root.addChild(cornerTag.view);

  const shellTick = shell.tick;
  shell.tick = (t: number) => {
    shellTick(t);
    for (const fn of ticks) fn(t);
  };

  return shell;
}
