"use client";

import dynamic from "next/dynamic";
import LeftRail from "./components/LeftRail";
import GroupComms from "./components/GroupComms";
import AgentProfileModal from "./components/AgentProfileModal";

const FacilityStage = dynamic(() => import("./world/FacilityStage"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center text-[#5D6B82] text-[11px] tracking-[0.3em] uppercase">
      booting facility…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020304] select-none flex">
      <LeftRail />
      <div className="relative flex-1 min-w-0">
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 h-12">
          <h1 className="text-[11px] text-[#2A3448] tracking-[0.3em] uppercase">
            Optimus Ecosystem
            <span className="text-[#C1121F] mx-1.5">//</span>
            <span className="text-[#C1121F]/60">Phase 1 PoC</span>
          </h1>
          <span className="text-[10px] text-[#3A4A60] tracking-[0.3em] uppercase">
            click an agent · open comms from the rail
          </span>
        </header>
        <FacilityStage />
      </div>
      <GroupComms />
      <AgentProfileModal />
    </main>
  );
}
