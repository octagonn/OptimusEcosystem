import { create } from "zustand";
import type { AgentName } from "@optimus/shared";

interface AgentProfileState {
  openAgent: AgentName | null;
  open: (agent: AgentName) => void;
  close: () => void;
}

export const useAgentProfile = create<AgentProfileState>((set) => ({
  openAgent: null,
  open: (openAgent) => set({ openAgent }),
  close: () => set({ openAgent: null }),
}));
