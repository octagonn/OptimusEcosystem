import { NextResponse } from "next/server";
import { getJwt, axUrl, spaceId, isAxConfigured } from "@/app/lib/ax";
import {
  emitChat,
  ensureOrchestrator,
  parseMentions,
  scheduleMockReply,
} from "@/app/lib/orchestrator";
import { listMessages } from "@/app/lib/store";
import type { ChatMessage } from "@/app/lib/types";

const newId = () => `M-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export async function GET() {
  ensureOrchestrator();
  const messages = await listMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  ensureOrchestrator();
  try {
    const { message, taskId } = await request.json();
    const text = String(message ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const mentions = parseMentions(text);

    const userMsg: ChatMessage = {
      id: newId(),
      channel: "comms",
      from: "user",
      agent: null,
      display: "you",
      text,
      mentions,
      ts: Date.now(),
      taskId: taskId ?? null,
    };
    await emitChat(userMsg);

    // Mock-mode auto-replies for each tagged agent so the feed always stays alive
    if (!isAxConfigured()) {
      const targets = mentions.length > 0 ? mentions : (["optimus-prime"] as const);
      for (const a of targets) scheduleMockReply(a, text, taskId ?? null);
      return NextResponse.json({ id: userMsg.id, mode: "mock", mentions: targets });
    }

    // Live-mode: forward to AX as a single channel message
    const jwt = await getJwt();
    const res = await fetch(axUrl("/api/v1/messages"), {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text,
        space_id: spaceId(),
        channel: "main",
        message_type: "text",
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "AX message send failed", status: res.status, detail },
        { status: 502 },
      );
    }
    const created = await res.json();
    return NextResponse.json({
      id: created.message?.id ?? created.id,
      mode: "live",
      mentions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
