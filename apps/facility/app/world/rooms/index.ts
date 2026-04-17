import type { AgentName } from "@optimus/shared";
import type { PaletteToken } from "@/graphics/palette";
import type { RoomShell } from "./RoomShell";
import { drawCommandNexus } from "./CommandNexus";
import { drawForgeWorkshop } from "./ForgeWorkshop";
import { drawAnvilServerHall } from "./AnvilServerHall";
import { drawNovaResearchRig } from "./NovaResearchRig";
import { drawLoreArchive } from "./LoreArchive";
import { drawScoutSignalsBay } from "./ScoutSignalsBay";

export interface RoomSpec {
  agent: AgentName;
  accentToken: PaletteToken;
  assetKey: string;
  label: string;
  labelCode: string;
  gridCol: 0 | 1 | 2;
  gridRow: 0 | 1;
  build: () => RoomShell;
}

export const ROOM_SPECS: RoomSpec[] = [
  { agent: "optimus-prime", accentToken: "prime", assetKey: "prime",
    label: "Command Nexus",      labelCode: "NX-01", gridCol: 0, gridRow: 0,
    build: drawCommandNexus },
  { agent: "optimus-forge", accentToken: "forge", assetKey: "forge",
    label: "Forge Workshop",     labelCode: "FG-02", gridCol: 1, gridRow: 0,
    build: drawForgeWorkshop },
  { agent: "optimus-anvil", accentToken: "anvil", assetKey: "anvil",
    label: "Anvil Server Hall",  labelCode: "AN-03", gridCol: 2, gridRow: 0,
    build: drawAnvilServerHall },
  { agent: "optimus-nova",  accentToken: "nova",  assetKey: "nova",
    label: "Nova Research Rig",  labelCode: "NV-04", gridCol: 0, gridRow: 1,
    build: drawNovaResearchRig },
  { agent: "optimus-lore",  accentToken: "lore",  assetKey: "lore",
    label: "Lore Archive",       labelCode: "LR-05", gridCol: 1, gridRow: 1,
    build: drawLoreArchive },
  { agent: "optimus-scout", accentToken: "scout", assetKey: "scout",
    label: "Scout Signals Bay",  labelCode: "SC-06", gridCol: 2, gridRow: 1,
    build: drawScoutSignalsBay },
];

export type { RoomShell };
