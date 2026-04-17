"use client";

import { useEffect } from "react";
import { useGroupChat } from "@/app/state/groupChatStore";
import type { BusEvent } from "@/app/lib/types";

let started = false;

/**
 * Mounts a single EventSource on first call and feeds it into the
 * group-chat store. Subsequent calls reuse the same connection.
 */
export function useFacilityStream(): void {
  const setMessages = useGroupChat((s) => s.setMessages);
  const appendMessage = useGroupChat((s) => s.appendMessage);
  const setTasks = useGroupChat((s) => s.setTasks);
  const upsertTask = useGroupChat((s) => s.upsertTask);
  const bumpActivity = useGroupChat((s) => s.bumpActivity);

  useEffect(() => {
    if (started) return;
    started = true;

    // Hydrate
    void Promise.all([
      fetch("/api/chat").then((r) => r.json()).catch(() => ({ messages: [] })),
      fetch("/api/tasks").then((r) => r.json()).catch(() => ({ tasks: [] })),
    ]).then(([m, t]) => {
      setMessages(m.messages ?? []);
      setTasks(t.tasks ?? []);
    });

    const es = new EventSource("/api/events");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as BusEvent;
        if (data.type === "chat") {
          appendMessage(data.message);
          if (data.message.agent) bumpActivity(data.message.agent);
        } else if (data.type === "task") {
          upsertTask(data.task);
          bumpActivity(data.task.assignee);
        } else if (data.type === "activity") {
          bumpActivity(data.agent);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      // Browser auto-reconnects EventSource; just log.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[facility] /api/events stream blip");
      }
    };
  }, [appendMessage, bumpActivity, setMessages, setTasks, upsertTask]);
}
