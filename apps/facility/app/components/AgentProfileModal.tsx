"use client";

import Image from "next/image";
import { X, MessagesSquare, MapPin, Sparkles } from "lucide-react";
import { useAgentProfile } from "@/app/state/agentProfileStore";
import { useGroupChat } from "@/app/state/groupChatStore";
import { AGENT_PROFILES } from "@/app/lib/agentProfiles";

export default function AgentProfileModal() {
  const openAgent = useAgentProfile((s) => s.openAgent);
  const close = useAgentProfile((s) => s.close);
  const setSeed = useGroupChat((s) => s.setSeed);

  if (!openAgent) return null;
  const p = AGENT_PROFILES[openAgent];

  const startChat = () => {
    // Pre-fill the comms composer with @handle plus a hint for the user.
    // setSeed also flips the panel open via groupChatStore.
    setSeed(`@${p.handle} `);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-[520px] max-w-[94vw] max-h-[90vh] overflow-hidden rounded-lg border border-[#1A2233] bg-[#070A11] flex flex-col font-mono shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: `0 30px 80px -30px ${p.accentHex}66, 0 0 0 1px #1A2233` }}
      >
        {/* Banner with portrait */}
        <div
          className="relative w-full h-[220px] shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${p.accentHex}33 0%, #070A11 100%)`,
          }}
        >
          <Image
            src={p.avatar}
            alt={p.name}
            fill
            sizes="520px"
            className="object-contain object-center"
            priority
          />
          <div
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, transparent 0%, #070A11 95%)",
            }}
          />
          <button
            onClick={close}
            type="button"
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur border border-[#1A2233] text-[#8A94A8] hover:text-[#D8DEE9] hover:border-[#3A4A60] flex items-center justify-center"
          >
            <X size={13} />
          </button>
        </div>

        {/* Identity strip */}
        <div className="px-5 pt-3 pb-4 border-b border-[#1A2233]">
          <div className="flex items-baseline gap-2">
            <h2
              className="text-[18px] font-bold tracking-tight"
              style={{ color: p.accentHex }}
            >
              {p.name}
            </h2>
            <span className="text-[10px] text-[#5D6B82] uppercase tracking-wider">
              @{p.handle.replace("optimus-", "")}
            </span>
          </div>
          <div className="text-[11px] text-[#8A94A8] mt-0.5">{p.role}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#3A4A60] mt-1.5">
            <MapPin size={10} />
            <span className="uppercase tracking-wider">{p.roomCode}</span>
            <span className="text-[#2A3448]">·</span>
            <span>{p.room}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <section>
            <div className="text-[9px] uppercase tracking-wider text-[#5D6B82] mb-1.5">
              brief
            </div>
            <p className="text-[11px] text-[#8A94A8] leading-relaxed">{p.blurb}</p>
          </section>

          <section>
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#5D6B82] mb-2">
              <Sparkles size={10} />
              capabilities
            </div>
            <ul className="grid grid-cols-2 gap-1.5">
              {p.capabilities.map((c) => (
                <li
                  key={c}
                  className="text-[10px] text-[#D8DEE9] px-2 py-1 rounded border"
                  style={{
                    borderColor: `${p.accentHex}30`,
                    backgroundColor: `${p.accentHex}0c`,
                  }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer / chat CTA */}
        <div className="px-5 py-3 border-t border-[#1A2233] flex items-center gap-2">
          <button
            onClick={close}
            type="button"
            className="px-3 h-8 rounded text-[10px] uppercase tracking-wider text-[#5D6B82] hover:text-[#D8DEE9] border border-transparent hover:border-[#1A2233] transition-colors"
          >
            close
          </button>
          <div className="flex-1" />
          <button
            onClick={startChat}
            type="button"
            className="flex items-center gap-1.5 px-3 h-8 rounded text-[10px] uppercase tracking-wider font-bold transition-colors"
            style={{
              backgroundColor: `${p.accentHex}1f`,
              border: `1px solid ${p.accentHex}`,
              color: p.accentHex,
            }}
          >
            <MessagesSquare size={12} />
            chat with {p.name.toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
