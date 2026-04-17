"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, FolderKanban } from "lucide-react";
import LeftRail from "@/app/components/LeftRail";
import GroupComms from "@/app/components/GroupComms";
import { useGroupChat } from "@/app/state/groupChatStore";
import { AGENT_PROFILES } from "@/app/lib/agentProfiles";
import type { Project, Task } from "@/app/lib/types";

export default function ProjectsPage() {
  const tasks = useGroupChat((s) => s.tasks);
  const setTasks = useGroupChat((s) => s.setTasks);
  const [projects, setProjects] = useState<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? []));
    void fetch("/api/tasks").then((r) => r.json()).then((d) => setTasks(d.tasks ?? []));
  }, [setTasks]);

  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const p of projects) map.set(p.id, []);
    for (const t of tasks) {
      if (!t.projectId) continue;
      const arr = map.get(t.projectId);
      if (arr) arr.push(t);
    }
    return map;
  }, [tasks, projects]);

  const activeProject = projects.find((p) => p.id === active);
  const activeTasks = active ? (tasksByProject.get(active) ?? []) : [];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020304] flex">
      <LeftRail />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center px-6 h-14 border-b border-[#1A2233] shrink-0">
          <h1 className="text-[12px] font-mono text-[#D8DEE9] tracking-[0.18em] uppercase">
            Projects
            <span className="text-[#C1121F] mx-2">//</span>
            <span className="text-[#5D6B82]">portfolio</span>
          </h1>
          <button
            onClick={() => setCreating(true)}
            type="button"
            className="ml-auto flex items-center gap-1.5 px-3 h-7 rounded bg-[#C1121F]/15 border border-[#C1121F]/40 text-[10px] font-mono uppercase tracking-wider text-[#C1121F] hover:bg-[#C1121F]/25"
          >
            <Plus size={12} />
            new project
          </button>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Project list */}
          <div className="col-span-4 border-r border-[#1A2233] overflow-y-auto p-3 space-y-2">
            {projects.length === 0 && (
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#3A4A60] text-center py-8">
                no projects — start one above
              </div>
            )}
            {projects.map((p) => {
              const ts = tasksByProject.get(p.id) ?? [];
              const live = ts.filter((t) => t.status !== "finished").length;
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(p.id)}
                  className={`w-full text-left rounded p-3 border bg-[#0B1220] transition-all ${isActive ? "ring-1" : "hover:border-[#5D6B82]"}`}
                  style={{
                    borderColor: isActive ? p.color : `${p.color}40`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban size={12} style={{ color: p.color }} />
                    <span className="text-[12px] font-mono text-[#D8DEE9]">{p.name}</span>
                    <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-[#5D6B82]">
                      {live}/{ts.length} live
                    </span>
                  </div>
                  {p.description && (
                    <div className="text-[10px] font-mono text-[#5D6B82] mt-1 leading-snug line-clamp-2">
                      {p.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="col-span-8 overflow-y-auto p-6 font-mono">
            {!activeProject ? (
              <div className="text-[11px] uppercase tracking-wider text-[#3A4A60]">
                select a project to inspect tasks
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-3 mb-2">
                  <h2 className="text-[18px]" style={{ color: activeProject.color }}>
                    {activeProject.name}
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider text-[#5D6B82]">
                    {activeProject.id}
                  </span>
                </div>
                <p className="text-[12px] text-[#8A94A8] leading-relaxed mb-6">
                  {activeProject.description || "no description"}
                </p>

                <div className="text-[10px] uppercase tracking-wider text-[#5D6B82] mb-2">
                  tasks · {activeTasks.length}
                </div>
                <div className="space-y-2">
                  {activeTasks.length === 0 && (
                    <div className="text-[11px] text-[#3A4A60]">
                      none yet — create a task on /tasks and link this project
                    </div>
                  )}
                  {activeTasks.map((t) => {
                    const p = AGENT_PROFILES[t.assignee];
                    return (
                      <div
                        key={t.id}
                        className="rounded border border-[#1A2233] bg-[#0B1220] p-3"
                        style={{ borderColor: `${p.accentHex}30` }}
                      >
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                          <span style={{ color: p.accentHex }}>@{p.handle.replace("optimus-", "")}</span>
                          <span className="text-[#3A4A60]">·</span>
                          <span className="text-[#8A94A8]">{t.status.replace("_", " ")}</span>
                          <span className="ml-auto text-[#3A4A60]">#{t.id.split("-").pop()}</span>
                        </div>
                        <div className="text-[12px] text-[#D8DEE9] mt-1">{t.title}</div>
                        {t.body && (
                          <div className="text-[10px] text-[#5D6B82] mt-1 leading-snug">{t.body}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {creating && (
        <NewProjectModal
          onClose={() => setCreating(false)}
          onCreated={(p) => {
            setProjects((arr) => [...arr, p]);
            setActive(p.id);
            setCreating(false);
          }}
        />
      )}

      <GroupComms />
    </main>
  );
}

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      onCreated(d.project);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-[440px] max-w-[92vw] rounded-lg border border-[#1A2233] bg-[#070A11] p-5 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-[#C1121F]">new project</h2>
          <button onClick={onClose} type="button" className="ml-auto text-[#5D6B82] hover:text-[#D8DEE9]">
            <X size={14} />
          </button>
        </div>
        <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1">name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[12px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60"
        />
        <label className="block text-[9px] uppercase tracking-wider text-[#5D6B82] mt-3 mb-1">description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-[#0B1220] border border-[#1A2233] rounded px-2 py-1.5 text-[11px] text-[#D8DEE9] outline-none focus:border-[#C1121F]/60 resize-none"
        />
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} type="button" className="px-3 h-8 rounded text-[10px] uppercase tracking-wider text-[#5D6B82] hover:text-[#D8DEE9]">
            cancel
          </button>
          <button
            onClick={() => void create()}
            disabled={!name.trim() || submitting}
            type="button"
            className="px-4 h-8 rounded text-[10px] uppercase tracking-wider bg-[#C1121F]/20 border border-[#C1121F]/50 text-[#C1121F] hover:bg-[#C1121F]/30 disabled:opacity-30"
          >
            create
          </button>
        </div>
      </div>
    </div>
  );
}
