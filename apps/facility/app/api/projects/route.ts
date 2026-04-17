import { NextResponse } from "next/server";
import { listProjects, upsertProject } from "@/app/lib/store";
import { ensureOrchestrator } from "@/app/lib/orchestrator";
import type { Project } from "@/app/lib/types";

const ACCENT_POOL = ["#C1121F", "#D4880F", "#6B8299", "#9B59D0", "#059669", "#45D6FF"];
const newId = () => `P-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`.toUpperCase();

export async function GET() {
  ensureOrchestrator();
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  ensureOrchestrator();
  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const existing = await listProjects();
  const color = ACCENT_POOL[existing.length % ACCENT_POOL.length];
  const project: Project = {
    id: newId(),
    name,
    description,
    color,
    createdAt: Date.now(),
  };
  await upsertProject(project);
  return NextResponse.json({ project });
}
