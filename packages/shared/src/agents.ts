export const AGENTS = [
  "optimus-prime",
  "optimus-forge",
  "optimus-anvil",
  "optimus-nova",
  "optimus-lore",
  "optimus-scout",
] as const;

export type AgentName = (typeof AGENTS)[number];

export const AGENT_ROLES: Record<AgentName, string> = {
  "optimus-prime": "Facility Commander",
  "optimus-forge": "Build Engineer",
  "optimus-anvil": "Systems Architect",
  "optimus-nova": "Research Lead",
  "optimus-lore": "Archive Librarian",
  "optimus-scout": "Signals Operator",
};
