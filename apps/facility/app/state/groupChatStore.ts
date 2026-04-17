import { create } from "zustand";
import type { ChatMessage, Task } from "@/app/lib/types";

interface GroupChatState {
  open: boolean;
  composerSeed: string;
  messages: ChatMessage[];
  tasks: Task[];
  activity: Record<string, number>; // agent → last activity ts
  toggle: () => void;
  setOpen: (v: boolean) => void;
  setSeed: (s: string) => void;
  setMessages: (m: ChatMessage[]) => void;
  appendMessage: (m: ChatMessage) => void;
  setTasks: (t: Task[]) => void;
  upsertTask: (t: Task) => void;
  bumpActivity: (agent: string) => void;
}

export const useGroupChat = create<GroupChatState>((set) => ({
  open: false,
  composerSeed: "",
  messages: [],
  tasks: [],
  activity: {},
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
  setSeed: (composerSeed) => set({ composerSeed, open: true }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (m) =>
    set((s) => {
      if (s.messages.some((x) => x.id === m.id)) return s;
      return { messages: [...s.messages, m] };
    }),
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (t) =>
    set((s) => {
      const idx = s.tasks.findIndex((x) => x.id === t.id);
      const next = [...s.tasks];
      if (idx >= 0) next[idx] = t;
      else next.unshift(t);
      return { tasks: next };
    }),
  bumpActivity: (agent) =>
    set((s) => ({ activity: { ...s.activity, [agent]: Date.now() } })),
}));
