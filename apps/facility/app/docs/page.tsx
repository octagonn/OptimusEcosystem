import LeftRail from "../components/LeftRail";
import { AGENT_PROFILES } from "../lib/agentProfiles";
import { AGENTS } from "@optimus/shared";

export const metadata = {
  title: "Optimus Ecosystem — Docs",
  description: "How the facility, the agents, and the AX bridge fit together.",
};

export default function DocsPage() {
  return (
    <main className="relative min-h-screen w-screen bg-[#020304] text-[#D8DEE9] font-mono flex">
      <LeftRail />

      <div className="flex-1 min-w-0">
        <header className="border-b border-[#1A2233] px-8 py-6">
          <div className="text-[10px] text-[#3A4A60] tracking-[0.3em] uppercase">
            optimus ecosystem // documentation
          </div>
          <h1 className="text-2xl tracking-tight text-[#D8DEE9] mt-1">
            How the facility works
          </h1>
          <p className="text-[12px] text-[#6A7488] mt-2 max-w-2xl leading-relaxed">
            A guided tour of the Pixi-rendered swarm, the agent click-to-chat loop,
            the AX bridge, and the CLI patterns that drive everything behind the scenes.
          </p>
        </header>

        <div className="px-8 py-8 max-w-4xl space-y-12">

          {/* ── 1. SYSTEM OVERVIEW ── */}
          <Section id="overview" title="1 // System Overview" code="SYS-01">
            <p>
              The facility is a single Next.js 16 app rendering a 3×2 grid of agent rooms
              into one PixiJS v8 stage. Each room is procedural — Graphics primitives,
              not sprites — wrapped in a single bloom + CRT + grain post-processing chain.
              Six agents live one per room. Click an agent → a modal opens →
              messages route through <code className="cd">/api/chat</code> → AX server →
              the agent replies in-stream over <code className="cd">/api/events</code> (SSE).
            </p>

            <Diagram>
              <svg viewBox="0 0 720 320" className="w-full h-auto">
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#6A7488" />
                  </marker>
                </defs>
                {/* Browser */}
                <Box x={20} y={40} w={180} h={240} title="Browser" subtitle="Next.js client" accent="#C1121F">
                  <text x={110} y={100} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">PixiJS Stage</text>
                  <text x={110} y={120} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">6 rooms · 6 agents</text>
                  <line x1={45} y1={140} x2={175} y2={140} stroke="#1A2233" />
                  <text x={110} y={160} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">Zustand store</text>
                  <text x={110} y={175} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">activeAgent · msgs</text>
                  <line x1={45} y1={195} x2={175} y2={195} stroke="#1A2233" />
                  <text x={110} y={215} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">React UI</text>
                  <text x={110} y={230} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">Rail · ChatModal · Docs</text>
                </Box>

                {/* Next.js server */}
                <Box x={270} y={40} w={180} h={240} title="Next.js server" subtitle="route handlers" accent="#45D6FF">
                  <text x={360} y={100} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">/api/chat</text>
                  <text x={360} y={115} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">POST → AX messages</text>
                  <line x1={295} y1={135} x2={425} y2={135} stroke="#1A2233" />
                  <text x={360} y={155} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">/api/events</text>
                  <text x={360} y={170} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">SSE proxy</text>
                  <line x1={295} y1={190} x2={425} y2={190} stroke="#1A2233" />
                  <text x={360} y={210} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">lib/ax.ts</text>
                  <text x={360} y={225} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">jwt exchange · cache</text>
                </Box>

                {/* AX */}
                <Box x={520} y={40} w={180} h={240} title="AX server" subtitle="next.paxai.app" accent="#9B59D0">
                  <text x={610} y={110} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">spaces · channels</text>
                  <text x={610} y={135} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">agent runtime</text>
                  <text x={610} y={160} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">message bus</text>
                  <text x={610} y={185} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">SSE fanout</text>
                  <text x={610} y={230} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">ax CLI ⇆ same API</text>
                </Box>

                {/* Arrows */}
                <line x1={205} y1={130} x2={265} y2={130} stroke="#6A7488" markerEnd="url(#arr)" />
                <text x={235} y={120} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">POST</text>
                <line x1={265} y1={170} x2={205} y2={170} stroke="#6A7488" markerEnd="url(#arr)" />
                <text x={235} y={185} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">SSE</text>

                <line x1={455} y1={130} x2={515} y2={130} stroke="#6A7488" markerEnd="url(#arr)" />
                <text x={485} y={120} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">REST</text>
                <line x1={515} y1={170} x2={455} y2={170} stroke="#6A7488" markerEnd="url(#arr)" />
                <text x={485} y={185} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">SSE</text>
              </svg>
            </Diagram>
          </Section>

          {/* ── 2. CLICK FLOW ── */}
          <Section id="click-flow" title="2 // Click → chat flow" code="UX-02">
            <p>
              Pixi has its own event system; the bridge to React is a Zustand store.
              Each agent rig sets <code className="cd">eventMode = "static"</code>,
              listens for <code className="cd">pointertap</code> (so viewport drag doesn’t
              steal the click), and on tap calls <code className="cd">useAgentChat.getState().open(agentName)</code>.
              The modal subscribes to <code className="cd">activeAgent</code> and renders when set.
            </p>

            <Diagram>
              <svg viewBox="0 0 720 200" className="w-full h-auto">
                <defs>
                  <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#6A7488" />
                  </marker>
                </defs>
                {[
                  { x: 10,  label: "click rig", sub: "Pixi pointertap" },
                  { x: 160, label: "open(agent)", sub: "Zustand store" },
                  { x: 310, label: "modal opens", sub: "React subscribes" },
                  { x: 460, label: "send draft", sub: "/api/chat POST" },
                  { x: 610, label: "AX dispatch", sub: "@handle mention" },
                ].map((s, i, arr) => (
                  <g key={i}>
                    <Box x={s.x} y={60} w={120} h={80} title={s.label} subtitle={s.sub} accent="#45D6FF" />
                    {i < arr.length - 1 && (
                      <line x1={s.x + 125} y1={100} x2={s.x + 155} y2={100} stroke="#6A7488" markerEnd="url(#arr2)" />
                    )}
                  </g>
                ))}
              </svg>
            </Diagram>
          </Section>

          {/* ── 3. AGENT ROSTER ── */}
          <Section id="roster" title="3 // Agent roster" code="ROS-03">
            <p>The six agents — each owns one room and one specialization.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 not-prose">
              {AGENTS.map((a) => {
                const p = AGENT_PROFILES[a];
                return (
                  <div
                    key={a}
                    className="p-3 rounded border bg-[#070A11]"
                    style={{ borderColor: `${p.accentHex}40` }}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[14px] font-bold" style={{ color: p.accentHex }}>{p.name}</span>
                      <span className="text-[10px] text-[#4A5568]">@{p.handle}</span>
                      <span className="ml-auto text-[9px] text-[#3A4A60]">{p.roomCode}</span>
                    </div>
                    <div className="text-[10px] text-[#6A7488] mt-1">{p.role} · {p.room}</div>
                    <div className="text-[11px] text-[#8A94A8] mt-2 leading-snug">{p.blurb}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 4. AX CLI ── */}
          <Section id="ax-cli" title="4 // AX CLI usage" code="CLI-04">
            <p>
              The AX CLI talks to the same REST + SSE surface this app does.
              Anything you can do in the browser, you can script from a terminal.
              These are the patterns this facility relies on.
            </p>

            <SubSection title="Send a message to an agent">
              <Code>{`# direct address — same as the chat modal
ax message optimus-forge "scaffold a new pixi room called PlasmaWing"

# broadcast to all agents in a channel
ax message --channel main "@all status check"`}</Code>
            </SubSection>

            <SubSection title="Listen to the swarm">
              <Code>{`# tail every message in real time
ax listen

# filter to one agent + pretty-print JSON
ax listen --agent optimus-scout --json | jq .`}</Code>
            </SubSection>

            <SubSection title="Manage agents">
              <Code>{`# list every agent in the space
ax agents list

# create a new specialist (handle becomes their @-mention)
ax agents create --handle optimus-medic --skill triage

# pause / resume an individual agent
ax agents pause optimus-nova
ax agents resume optimus-nova`}</Code>
            </SubSection>

            <SubSection title="Tasks + context">
              <Code>{`# queue a task on an agent
ax tasks create --owner optimus-anvil --title "rotate cold-tier disks"

# attach context (file, URL, text) to the active conversation
ax context add ./bench-results.json --tag perf
ax context add https://example.com/spec --tag reference`}</Code>
            </SubSection>

            <SubSection title="Env this app expects">
              <Code>{`# .env.local in apps/facility/
AX_BASE_URL=https://next.paxai.app
AX_SPACE_ID=<your-space-id>
AX_UI_TOKEN=<your-ui-token>

# For the live CLI bridge (ax listen / ax send) — optional
AX_TOKEN=<cli-token-if-not-using-ax-auth-login>
AX_BIN=ax             # path to the ax binary if not on PATH
AX_ENABLED=auto       # "off" to force mock mode even when credentials exist`}</Code>
              <p className="text-[11px] text-[#6A7488] mt-2">
                Without these set, <code className="cd">/api/chat</code> falls back to a mock that
                echoes your message — useful for UI work without burning AX quota.
                The bridge panel inside <code className="cd">#comms → ax</code> shows whether
                the CLI is reachable; hit <code className="cd">retry connect</code> after
                running <code className="cd">ax auth login</code>.
              </p>
            </SubSection>
          </Section>

          {/* ── 4b. BRIDGE ARCHITECTURE ── */}
          <Section id="ax-bridge" title="4b // AX CLI bridge" code="BRG-04B">
            <p>
              The bridge wires the local facility to the upstream AX space in both
              directions. It&apos;s the reason an agent reply typed here shows up on
              <code className="cd"> next.paxai.app</code>, and why an @mention posted
              there appears in the <code className="cd">#comms</code> feed.
            </p>

            <Diagram>
              <svg viewBox="0 0 720 260" className="w-full h-auto">
                <defs>
                  <marker id="arrB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#6A7488" />
                  </marker>
                </defs>

                <Box x={20} y={30} w={200} h={200} title="Facility server" subtitle="Next.js runtime" accent="#C1121F">
                  <text x={120} y={80} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">orchestrator.ts</text>
                  <text x={120} y={95} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">emitChat()</text>
                  <line x1={40} y1={115} x2={200} y2={115} stroke="#1A2233" />
                  <text x={120} y={135} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">axBridge.ts</text>
                  <text x={120} y={150} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">spawn + NDJSON parse</text>
                  <line x1={40} y1={170} x2={200} y2={170} stroke="#1A2233" />
                  <text x={120} y={190} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">eventBus</text>
                  <text x={120} y={205} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">SSE fanout → clients</text>
                </Box>

                <Box x={270} y={30} w={180} h={200} title="ax CLI" subtitle="child processes" accent="#45D6FF">
                  <text x={360} y={80} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">ax listen --json</text>
                  <text x={360} y={95} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">6× one-per-agent</text>
                  <line x1={290} y1={115} x2={430} y2={115} stroke="#1A2233" />
                  <text x={360} y={135} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">ax send</text>
                  <text x={360} y={150} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">per agent emit</text>
                  <line x1={290} y1={170} x2={430} y2={170} stroke="#1A2233" />
                  <text x={360} y={195} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">uses AX_TOKEN / login</text>
                </Box>

                <Box x={500} y={30} w={200} h={200} title="AX platform" subtitle="next.paxai.app" accent="#9B59D0">
                  <text x={600} y={95} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">space · channels</text>
                  <text x={600} y={115} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">agent runtime</text>
                  <text x={600} y={135} textAnchor="middle" fill="#8A94A8" fontSize="10" fontFamily="monospace">message bus</text>
                  <text x={600} y={160} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">browser UI opens in a tab</text>
                  <text x={600} y={175} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">(iframes blocked by CSP)</text>
                </Box>

                <line x1={225} y1={90} x2={265} y2={90} stroke="#6A7488" markerEnd="url(#arrB)" />
                <text x={245} y={80} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">mirror</text>
                <line x1={265} y1={170} x2={225} y2={170} stroke="#6A7488" markerEnd="url(#arrB)" />
                <text x={245} y={184} textAnchor="middle" fill="#6A7488" fontSize="9" fontFamily="monospace">inbound</text>

                <line x1={455} y1={90} x2={495} y2={90} stroke="#6A7488" markerEnd="url(#arrB)" />
                <line x1={495} y1={170} x2={455} y2={170} stroke="#6A7488" markerEnd="url(#arrB)" />
              </svg>
            </Diagram>

            <SubSection title="Outbound mirror">
              <p>
                Every agent message emitted by <code className="cd">orchestrator.ts</code> runs
                through <code className="cd">emitChat()</code>, which checks the
                <code className="cd"> fromAx</code> flag and, if it&apos;s locally generated,
                queues an <code className="cd">ax send --agent &lt;name&gt; --content …</code>
                spawn. The queue is serial per process so we never swamp the CLI with
                simultaneous writes. User + system rows are never mirrored — only agents.
              </p>
            </SubSection>

            <SubSection title="Inbound listener">
              <p>
                On orchestrator boot (first API request to <code className="cd">/api/chat</code>,
                <code className="cd"> /api/events</code>, or <code className="cd">/api/ax/status</code>),
                <code className="cd"> ensureAxBridgeStarted()</code> runs one probe
                (<code className="cd">ax agents list</code>) and — if that succeeds — spawns
                <code className="cd"> ax listen --json --agent &lt;name&gt;</code> once per
                <code className="cd"> optimus-*</code> handle. Each NDJSON line becomes a
                <code className="cd"> ChatMessage</code> with <code className="cd">fromAx: true</code>
                so it&apos;s not re-mirrored back out.
              </p>
            </SubSection>

            <SubSection title="Why not an iframe?">
              <p>
                AX redirects unauthenticated visitors through GitHub OAuth, and GitHub
                sets <code className="cd">frame-ancestors &apos;none&apos;</code> — the login
                page simply refuses to render inside an iframe. The bridge panel replaces
                the old embed with a launch button + live status of the six listener
                processes.
              </p>
            </SubSection>

            <SubSection title="Status endpoint">
              <Code>{`# probes the CLI, starts listeners if reachable, returns JSON
curl http://localhost:3100/api/ax/status

# same route with POST forces a reconnect (idempotent)
curl -X POST http://localhost:3100/api/ax/status`}</Code>
            </SubSection>
          </Section>

          {/* ── 5. CREATIVE IDEAS ── */}
          <Section id="creative" title="5 // Creative AX CLI ideas" code="LAB-05">
            <p>Things you could wire on top of the existing pipeline.</p>

            <IdeaList items={[
              {
                title: "Live activity → in-world VFX",
                body: "Subscribe `ax listen --json` in a tiny client agent. When optimus-forge sends a message, the ForgeWorkshop's anvil sparks fire harder and the furnace flame brightens for 2s. Each agent has a paired room-FX trigger.",
                tag: "fx-bridge",
              },
              {
                title: "Cron-driven facility shifts",
                body: "Schedule `ax broadcast \"shift change\"` every 6h. Rooms dim by 40% when the agent is off-duty; the dust motes slow down; the room label dulls. Comes back online with a wake-up sweep.",
                tag: "ambient",
              },
              {
                title: "Status JSON publishers",
                body: "Each agent emits `ax publish status '{queue: N, cpu: 0.x}'` every 30s. The facility HUD reads the channel and renders queue badges over each room door + a CPU ring around the agent's head.",
                tag: "telemetry",
              },
              {
                title: "Quest / mission mode",
                body: "Type `@optimus-prime mission <goal>` and Prime fans the work out across the swarm. Each agent's reply triggers its room's signature animation: Lore flips a codex page, Anvil spins up a RAID disk, Scout fires a radar blip.",
                tag: "interactive",
              },
              {
                title: "Replay scrubber",
                body: "Pipe `ax events --since=1h --jsonl` to a file. Add a timeline along the docs page that scrubs through messages and replays them onto the live canvas — see what the swarm did this morning.",
                tag: "history",
              },
              {
                title: "Skills hot-swap",
                body: "`ax skills install ./forge-skills/` re-arms an agent's tool belt mid-session. Forge's hammer icon glows for 1s when a new skill lands, signalling the swap to the user.",
                tag: "tooling",
              },
              {
                title: "Cross-agent council",
                body: "`ax channel create council` then have any 3 agents debate a question. The chat modal grows a 'Council' tab with the multi-thread view; the matching rooms beam light pulses to a center stage.",
                tag: "social",
              },
              {
                title: "CLI-as-control-plane",
                body: "Pause / resume rooms with one command. `ax agents pause optimus-forge` greys out FORGE, halts the robotic arm, and lowers the room wash; resume reignites everything.",
                tag: "control",
              },
            ]} />
          </Section>

          {/* ── 6. FILE LAYOUT ── */}
          <Section id="files" title="6 // Where to find things" code="FS-06">
            <Code>{`apps/facility/
├── app/
│   ├── page.tsx                — main canvas + sidebar + modal mount
│   ├── docs/page.tsx           — this page
│   ├── components/
│   │   ├── LeftRail.tsx        — fixed left sidebar nav
│   │   └── AgentChatModal.tsx  — click-to-chat modal
│   ├── state/
│   │   └── agentChatStore.ts   — Zustand: activeAgent, messages
│   ├── lib/
│   │   ├── ax.ts               — JWT exchange + AX URL helpers
│   │   └── agentProfiles.ts    — name, role, accent per agent
│   ├── api/
│   │   ├── chat/route.ts       — POST → AX /api/v1/messages
│   │   └── events/route.ts     — SSE proxy → AX /api/sse/messages
│   └── world/
│       ├── FacilityStage.tsx   — Pixi mount + viewport + click wiring
│       ├── rooms/              — 6 procedural rooms (one per agent)
│       └── props/              — Forge/Anvil/Nova/Lore/Scout/Prime props
└── package.json                — dev runs on 0.0.0.0:3100`}</Code>
          </Section>

          <footer className="pt-8 border-t border-[#1A2233] text-[10px] text-[#3A4A60] tracking-wider uppercase">
            optimus ecosystem // phase 1 poc · docs build {new Date().toISOString().slice(0, 10)}
          </footer>
        </div>
      </div>
    </main>
  );
}

/* ─── Small presentational helpers ─── */

function Section({
  id, title, code, children,
}: { id: string; title: string; code: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-12">
      <div className="flex items-baseline gap-3 border-b border-[#1A2233] pb-2">
        <h2 className="text-[18px] tracking-tight text-[#D8DEE9]">{title}</h2>
        <span className="ml-auto text-[10px] text-[#3A4A60] tracking-wider">{code}</span>
      </div>
      <div className="text-[12px] text-[#8A94A8] leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="text-[11px] text-[#6A7488] uppercase tracking-wider mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#070A11] border border-[#1A2233] rounded p-3 text-[11px] text-[#D8DEE9] overflow-x-auto leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Diagram({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#070A11] border border-[#1A2233] rounded p-4">
      {children}
    </div>
  );
}

function Box({
  x, y, w, h, title, subtitle, accent, children,
}: {
  x: number; y: number; w: number; h: number;
  title: string; subtitle?: string; accent: string;
  children?: React.ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#0B1220" stroke={accent} strokeOpacity={0.55} />
      <rect x={x} y={y} width={w} height={18} rx={4} fill={accent} fillOpacity={0.1} />
      <text x={x + 8} y={y + 13} fontSize={10} fontFamily="monospace" fill={accent}>{title}</text>
      {subtitle && (
        <text x={x + w - 8} y={y + 13} fontSize={8} fontFamily="monospace" fill="#6A7488" textAnchor="end">{subtitle}</text>
      )}
      {children}
    </g>
  );
}

function IdeaList({ items }: { items: { title: string; body: string; tag: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 not-prose">
      {items.map((it) => (
        <div key={it.title} className="p-3 rounded border border-[#1A2233] bg-[#070A11]">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-[#D8DEE9]">{it.title}</span>
            <span className="text-[9px] text-[#45D6FF]/70 tracking-wider uppercase">{it.tag}</span>
          </div>
          <p className="text-[11px] text-[#8A94A8] leading-relaxed mt-1.5">{it.body}</p>
        </div>
      ))}
    </div>
  );
}
