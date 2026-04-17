import type { AgentName } from "@optimus/shared";
import type { PaletteToken } from "@/graphics/palette";
import { PALETTE } from "@/graphics/palette";

export interface AgentProfile {
  agent: AgentName;
  handle: string;
  name: string;
  role: string;
  room: string;
  roomCode: string;
  accentToken: PaletteToken;
  accentHex: string;
  avatar: string;
  blurb: string;
  capabilities: string[];
}

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

export const AGENT_PROFILES: Record<AgentName, AgentProfile> = {
  "optimus-prime": {
    agent: "optimus-prime",
    handle: "optimus-prime",
    name: "PRIME",
    role: "Facility Commander",
    room: "Command Nexus",
    roomCode: "NX-01",
    accentToken: "prime",
    accentHex: hex(PALETTE.prime),
    avatar: "/assets/portraits/prime.png",
    blurb: "Coordinates cross-bay operations, sets priorities, escalates blockers.",
    capabilities: ["Mission planning", "Cross-bay routing", "Status synthesis", "Escalation"],
  },
  "optimus-forge": {
    agent: "optimus-forge",
    handle: "optimus-forge",
    name: "FORGE",
    role: "Build Engineer",
    room: "Forge Workshop",
    roomCode: "FG-02",
    accentToken: "forge",
    accentHex: hex(PALETTE.forge),
    avatar: "/assets/portraits/forge.png",
    blurb: "Assembles modules, scaffolds projects, owns the build pipeline.",
    capabilities: ["Scaffolding", "Refactor", "Pipeline ops", "Module compilation"],
  },
  "optimus-anvil": {
    agent: "optimus-anvil",
    handle: "optimus-anvil",
    name: "ANVIL",
    role: "Systems Architect",
    room: "Anvil Server Hall",
    roomCode: "AN-03",
    accentToken: "anvil",
    accentHex: hex(PALETTE.anvil),
    avatar: "/assets/portraits/anvil.png",
    blurb: "Operates infra, storage, networking. Owns the cold-storage vault.",
    capabilities: ["Infra design", "Storage layout", "Throughput tuning", "Failover"],
  },
  "optimus-nova": {
    agent: "optimus-nova",
    handle: "optimus-nova",
    name: "NOVA",
    role: "Research Lead",
    room: "Nova Research Rig",
    roomCode: "NV-04",
    accentToken: "nova",
    accentHex: hex(PALETTE.nova),
    avatar: "/assets/portraits/nova.png",
    blurb: "Runs experiments, evaluates models, prototypes novel approaches.",
    capabilities: ["Experiment design", "Model eval", "Anomaly hunting", "Prototyping"],
  },
  "optimus-lore": {
    agent: "optimus-lore",
    handle: "optimus-lore",
    name: "LORE",
    role: "Archive Librarian",
    room: "Lore Archive",
    roomCode: "LR-05",
    accentToken: "lore",
    accentHex: hex(PALETTE.lore),
    avatar: "/assets/portraits/lore.png",
    blurb: "Curates knowledge base, indexes records, surfaces historical context.",
    capabilities: ["Indexing", "RAG curation", "Schema migration", "Citation lookup"],
  },
  "optimus-scout": {
    agent: "optimus-scout",
    handle: "optimus-scout",
    name: "SCOUT",
    role: "Signals Operator",
    room: "Scout Signals Bay",
    roomCode: "SC-06",
    accentToken: "scout",
    accentHex: hex(PALETTE.scout),
    avatar: "/assets/portraits/scout.png",
    blurb: "Monitors external signals, tracks contacts, runs perimeter recon.",
    capabilities: ["Signal triage", "Triangulation", "Threat intel", "Contact tracking"],
  },
};
