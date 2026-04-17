import { NextResponse } from "next/server";
import { ensureOrchestrator } from "@/app/lib/orchestrator";
import { ensureAxBridgeStarted, getAxBridgeStatus } from "@/app/lib/axBridge";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureOrchestrator();
  await ensureAxBridgeStarted();
  return NextResponse.json(getAxBridgeStatus());
}

export async function POST() {
  ensureOrchestrator();
  await ensureAxBridgeStarted();
  return NextResponse.json(getAxBridgeStatus());
}
