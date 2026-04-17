"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Settings, Activity, KanbanSquare, FolderKanban, MessagesSquare } from "lucide-react";
import { useGroupChat } from "@/app/state/groupChatStore";

interface RailButtonProps {
  active?: boolean;
  href?: string;
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}

function RailButton({ active, href, onClick, title, children }: RailButtonProps) {
  const cls = [
    "group relative flex items-center justify-center w-10 h-10 rounded-md",
    "transition-colors",
    active
      ? "text-[#C1121F] bg-[#C1121F]/10 ring-1 ring-[#C1121F]/30"
      : "text-[#4A5568] hover:text-[#8A94A8] hover:bg-white/5",
  ].join(" ");
  const tooltip = (
    <span className="pointer-events-none absolute left-12 px-2 py-1 rounded bg-[#0B1220] border border-[#1A2233] text-[10px] font-mono uppercase tracking-wider text-[#8A94A8] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
      {title}
    </span>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
        {tooltip}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} type="button">
      {children}
      {tooltip}
    </button>
  );
}

export default function LeftRail() {
  const pathname = usePathname();
  const chatOpen = useGroupChat((s) => s.open);
  const setOpen = useGroupChat((s) => s.setOpen);
  const liveTasks = useGroupChat(
    (s) => s.tasks.filter((t) => t.status !== "finished").length,
  );

  return (
    <aside className="relative z-30 shrink-0 h-full w-14 bg-[#020304]/90 border-r border-[#1A2233] backdrop-blur-sm flex flex-col items-center py-3 gap-2">
      {/* Logo */}
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#C1121F]/15 border border-[#C1121F]/40 mb-1">
        <span className="text-[#C1121F] font-mono font-bold text-[11px] tracking-tighter">OE</span>
      </div>

      <div className="w-8 h-px bg-[#1A2233] my-1" />

      {/* Top nav */}
      <RailButton href="/" active={pathname === "/"} title="Facility">
        <Home size={16} />
      </RailButton>
      <RailButton href="/tasks" active={pathname?.startsWith("/tasks") ?? false} title="Tasks">
        <div className="relative">
          <KanbanSquare size={16} />
          {liveTasks > 0 && (
            <span
              className="absolute -top-1 -right-1.5 px-1 min-w-[12px] h-3 inline-flex items-center justify-center rounded-full text-[8px] font-mono bg-[#C1121F] text-white"
            >
              {liveTasks}
            </span>
          )}
        </div>
      </RailButton>
      <RailButton href="/projects" active={pathname?.startsWith("/projects") ?? false} title="Projects">
        <FolderKanban size={16} />
      </RailButton>
      <RailButton href="/docs" active={pathname?.startsWith("/docs") ?? false} title="Docs">
        <BookOpen size={16} />
      </RailButton>

      <div className="w-8 h-px bg-[#1A2233] my-1" />

      {/* Group chat toggle — sole entry to the comms panel from the rail */}
      <RailButton
        active={chatOpen}
        title="Group Chat"
        onClick={() => setOpen(!chatOpen)}
      >
        <MessagesSquare size={16} />
      </RailButton>

      <div className="flex-1" />

      {/* Status + settings at bottom */}
      <div className="flex items-center justify-center w-10 h-10 rounded-md text-[#3A4A60]" title="Swarm: live">
        <Activity size={14} className="text-emerald-500/80 animate-pulse" />
      </div>
      <RailButton title="Settings" onClick={() => { /* placeholder */ }}>
        <Settings size={16} className="opacity-50" />
      </RailButton>
    </aside>
  );
}
