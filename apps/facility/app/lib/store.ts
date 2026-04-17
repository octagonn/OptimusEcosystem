import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChatMessage, Project, Task } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const MESSAGE_CAP = 250;

interface Snapshot {
  tasks: Map<string, Task>;
  projects: Map<string, Project>;
  messages: ChatMessage[];
  loaded: boolean;
}

const g = globalThis as unknown as { __optimusStore?: Snapshot };
const snap: Snapshot = g.__optimusStore ?? {
  tasks: new Map(),
  projects: new Map(),
  messages: [],
  loaded: false,
};
g.__optimusStore = snap;

async function ensureLoaded(): Promise<void> {
  if (snap.loaded) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  const rawTasks = await readJson<Task[]>(TASKS_FILE, []);
  snap.tasks = new Map(
    rawTasks.map((t) => [t.id, { ...t, question: t.question ?? null }]),
  );
  snap.projects = new Map(
    (await readJson<Project[]>(PROJECTS_FILE, [])).map((p) => [p.id, p]),
  );
  snap.messages = await readJson<ChatMessage[]>(MESSAGES_FILE, []);
  if (snap.projects.size === 0) {
    const seed: Project = {
      id: "proj-facility",
      name: "Facility Bring-up",
      description: "Default project for everything related to standing up the facility.",
      color: "#C1121F",
      createdAt: Date.now(),
    };
    snap.projects.set(seed.id, seed);
    await writeJson(PROJECTS_FILE, [...snap.projects.values()]);
  }
  snap.loaded = true;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

// ─── Tasks ─────────────────────────────────────────────────────

export async function listTasks(): Promise<Task[]> {
  await ensureLoaded();
  return [...snap.tasks.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getTask(id: string): Promise<Task | null> {
  await ensureLoaded();
  return snap.tasks.get(id) ?? null;
}

export async function upsertTask(task: Task): Promise<void> {
  await ensureLoaded();
  snap.tasks.set(task.id, task);
  await writeJson(TASKS_FILE, [...snap.tasks.values()]);
}

// ─── Projects ──────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  await ensureLoaded();
  return [...snap.projects.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export async function upsertProject(project: Project): Promise<void> {
  await ensureLoaded();
  snap.projects.set(project.id, project);
  await writeJson(PROJECTS_FILE, [...snap.projects.values()]);
}

// ─── Messages ──────────────────────────────────────────────────

export async function listMessages(): Promise<ChatMessage[]> {
  await ensureLoaded();
  return [...snap.messages];
}

export async function pushMessage(msg: ChatMessage): Promise<void> {
  await ensureLoaded();
  snap.messages.push(msg);
  if (snap.messages.length > MESSAGE_CAP) {
    snap.messages.splice(0, snap.messages.length - MESSAGE_CAP);
  }
  await writeJson(MESSAGES_FILE, snap.messages);
}
