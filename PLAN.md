# Optimus Ecosystem — Master Plan

> Gamified living-world dashboard for an AX-powered AI swarm.
> Mobile command via Telegram; desktop observability via a procedurally-rendered facility.

---

## 1. Vision

Three surfaces, one protocol:

- **Mobile (Telegram)** — your phone is the command line. You write to the swarm from anywhere.
- **Desktop (facility UI)** — the god-view. You *watch* the swarm work in a world that reacts to real AX activity in real time.
- **AX Platform + `ax` CLI** — the sole communication substrate. No parallel protocols, no second auth layer, no message bus to maintain.

The desktop is never the input device anymore; it is the observability surface. The phone is never the display; it is the input. This split makes each side simpler.

### Positioning vs aX Gateway (upstream execution plane)

The aX team is building a separate product — **aX Gateway** — that will sit on each device as the trust anchor for agent execution (credential broker, work-lease queue, policy gate, 11-method protocol, fleet telemetry). Optimus Ecosystem is **not** an implementation of that plane; it is a **consumer** of it.

Today Optimus shells out to `ax listen --json` per agent (subprocess bridge via `axBridge.ts`). Once aX Gateway phase 3 (telemetry) lands, the subprocess path gets swapped for a gateway SSE/event client — same event shape, no PAT in runtime config, no per-agent subprocess. The facility UI is the "dashboard skin" over whichever surface the gateway exposes.

This means:
- Today's `AX_UI_TOKEN` user PAT is a **pre-gateway stopgap**. Vision slide 4 of the aX Gateway deck forbids it; we accept the stopgap until the gateway credential broker exists.
- `axBridge.ts` should expose a swappable event-source seam so the future gateway client slots in without touching the rest of the app.
- The six Transformers agent names stay — they are *display roles*, not infrastructure primitives.

---

## 1.5. Carry-over from OptimusFacility (non-negotiable)

The Ecosystem is a **re-skin and expansion** of OptimusFacility, not a greenfield swarm. We preserve:

### The six existing AX agents (unchanged)
| Agent | Role | Room accent | Token |
|-------|------|-------------|-------|
| `optimus-prime` | Facility Commander | `#C1121F` | `axp_a_*` |
| `optimus-forge` | Build Engineer | `#D4880F` | `axp_a_*` |
| `optimus-anvil` | Systems Architect | `#6B8299` | `axp_a_*` |
| `optimus-nova` | Research Lead | `#9B59D0` | `axp_a_*` |
| `optimus-lore` | Archive Librarian | `#059669` | `axp_a_*` |
| `optimus-scout` | Signals Operator | `#45D6FF` | `axp_a_*` |

Canonical space: configured via `AX_SPACE_ID` env var (server-side only; never in client code).

### Phase 1 acceptance brief v1.1a (canonical)
Source: internal Phase 1 acceptance brief v1.1a (owner: Nova, dated 2026-04-12).

Contracts we must honor from the first deploy:
- **Reply correlation via `reply_to`** is the only accepted contract. No content-sniffing, no polling hacks.
- **Three UI states only**: `idle`, `processing-red`, `replied`. No intermediate shimmer.
- **AX is the source of truth**; the UI is a state projection layer, never a parallel store.
- **120s hard timeout** on any round-trip; beyond that surface a "still thinking" fallback.
- **Routes preserved**: `GET /api/state`, `GET /api/events` (SSE passthrough), `POST /api/chat`.
- **Dispatch pipeline preserved**: `dispatch.sh` pause sentinel + 6/60s rate limit circuit breaker, per-agent `ax listen`.

The new desktop facility UI is a **replacement skin** over this contract — same API surface, same AX flow, new renderer and new mobile surface.

---

## 2. Architecture

```
  ┌────────────────┐    ┌──────────────────────┐    ┌────────────────┐
  │  Phone         │    │  optimus-gateway     │    │  optimus-      │
  │  (Telegram)    │◄──►│  (Python bridge)     │◄──►│  prime         │
  └────────────────┘    │  - TG bot API        │    │  (AX agent)    │
                        │  - ax send/listen    │    └──────┬─────────┘
                        │  - slash cmds        │           │ @mentions
                        └────┬─────────────────┘           ▼
                             │                     ┌──────────────┐
                             │  ax CLI             │ forge, anvil │
                             │                     │ nova, lore,  │
                             │                     │ scout        │
                             │                     └──────┬───────┘
                             │                            │
                             ▼                            ▼
                        ┌───────────────────────────────────────┐
                        │  Activity Bus (NDJSON over SSE)       │
                        │  tails dispatch_*.log + ax messages   │
                        └────┬──────────────────────────────────┘
                             │
                             ▼
                        ┌──────────────────┐
                        │  Facility UI     │
                        │  Next.js 16 +    │
                        │  PixiJS v8 +     │
                        │  GLSL post-fx    │
                        └──────────────────┘
```

Everything the Telegram side does, it does by calling `ax`. Everything the desktop does, it does by reading WSL logs + `ax messages list`. No new protocol.

---

## 3. Tech Stack

### Runtime
| Layer | Tech | Why |
|------|------|-----|
| Monorepo | pnpm workspaces | minimal tooling, shared types |
| Desktop UI shell | Next.js 16 + TS + Tailwind | same as OptimusFacility, proven |
| **Game renderer** | **PixiJS v8** (switching from Phaser) | first-class Graphics API, better shader pipeline, thin WebGL2 wrapper |
| Shaders | GLSL via PixiJS `Filter` | post-processing chain |
| UI animations | GSAP + Framer Motion | easing curves, UI juice |
| State | Zustand (UI) + SSE (activity) | no over-engineering |
| Telegram bot | Python 3.12 + `python-telegram-bot` (async) | mature, stable, simple |
| AX integration | existing `ax` CLI | unchanged |

### Why Phaser → PixiJS

The previous facility looked bad partly *because* we used Phaser. Phaser's defaults are tuned for platformers — its tilemap looks like programmer art without heavy art assets. PixiJS is a thinner WebGL wrapper with:
- Built-in `Graphics` API for drawing vector/SDF shapes procedurally
- Filter pipeline (`BlurFilter`, `GlitchFilter`, custom GLSL) that composes cleanly
- Large creative-coding community (more generative-art examples to learn from)
- Lower overhead → we can push more particles and shaders at 60fps

---

## 4. Programmatic Graphics Strategy (THE hard part)

### 4.0 Visual north star — preserve the current Facility aesthetic

Reference screenshot: the canonical Facility reference image (2026-04-14). The existing Phaser facility established the look we **keep**:

- **Top-down 2D** (not isometric, not 3D) — floor-plan readability at a glance
- **Dark starfield void** backdrop; rooms float as illuminated islands
- **2×3 room grid** with connecting corridors
- **Per-room color wash** using canonical agent accents:
  - Prime crimson `#C1121F` — command nexus with Ultron emblem + curved viewports
  - Forge amber `#D4880F` — warm workshop, lanterns, workbenches
  - Anvil steel `#6B8299` — cold architectural grid, server stacks
  - Nova violet `#9B59D0` — research station, circular central rig
  - Lore emerald `#059669` — archive shelves, librarian stacks
  - Scout cyan `#45D6FF` — signals ops, holo table
- **Pixel-art interior props** (desks, consoles, shelves, holo displays) with distinct per-agent furniture
- **Subtle ambient glow** per room that reads the accent from outside

What the PixiJS rebuild improves (without changing the look):
- Shader-driven **bloom, CRT, grain, chromatic aberration** (Phaser's filter chain was the bottleneck)
- **SDF-drawn** walls and consoles → crisp at any zoom, soft glow for free
- **Rigged agent sprites** that breathe/walk instead of static placeholders
- **Real-time activity binding** — rooms light up, consoles blink, @mention beams between rooms when agents cross-talk

The goal is *the same screenshot, but alive and responsive*. Not a visual redesign.

### 4.1 Discipline layers — to execute the look above

To get AAA-feeling procedural graphics we enforce **discipline** across five layers (detailed in 4.2–4.8).

### 4.2 Strict palette (max 32 colors, locked from the current Facility)

Palette tokens derive from the six canonical agent accents + the dark-void/steel supporting colors visible in the screenshot. No ad-hoc hex codes anywhere.

No ad-hoc hex codes anywhere in the codebase. Every color is a named token in `graphics/palette.ts`. Candidate palette for Ultron/cyberpunk vibe:

```
Navy 900 → 100 (9 steels)
Red (brand)
Amber, Cyan, Purple, Green — accent trio for agents
Ivory (text), Charcoal (shadow)
Hologram teal, Warning gold
```

We audit every generated pixel to ensure it maps to one of these tokens. Reference: Lospec palettes, Endesga-32, Aap-64 — pick one and commit.

### 4.2 SDF primitives instead of rectangles

Every shape in the world — rooms, walls, consoles, monitors, agent bodies — is drawn as an **SDF composition** (rounded rects, circles, hexagons via union/subtract/intersect), not raw `fillRect`. This gives us for free:

- Anti-aliasing at any zoom
- Crisp outlines via distance threshold
- Soft glow (blur on the distance field)
- Soft shadows (distance-offset darken)
- Normal maps for faux lighting (gradient of the distance field)

Implement a small SDF helper (~150 LOC) that renders shapes to `RenderTexture` then composites into the scene.

### 4.3 Procedural texture layer

Every surface gets four stacked passes:

1. **Base** — solid palette color
2. **Noise** — simplex at two octaves, ±8% luminance wobble
3. **Pattern** — wang tiles / voronoi / marching squares for wall panels, floor grates, circuit traces
4. **Grunge** — multiplicative noise for wear, scratches, dust accumulation

A flat palette color never hits the screen untouched.

### 4.4 Post-processing shader chain (the secret sauce)

Applied as PixiJS filters at full-screen:

| Pass | Purpose | Intensity |
|------|---------|-----------|
| CRT curvature | subtle warp near edges | 3–5% |
| Scanlines | flickering horizontal bands | 6% alpha |
| Bloom | on emissive pixels only | threshold-gated |
| Chromatic aberration | rgb split at edges | 0.5px |
| Color grading LUT | cinematic teal/orange (or custom) | 30% strength |
| Vignette | radial darken | 25% |
| Film grain | animated noise | 2% |

This stack alone is what separates "programmer art" from "feels like a game." The CRT + bloom combo is what Balatro, Inscryption, and Signalis all use.

### 4.5 Motion discipline (the Balatro lesson)

Nothing static, ever. Every element has ambient motion:

- Agent sprites **breathe** (vertical bob, 1.5s sine)
- Lights **flicker** (perlin noise on alpha, 0.2 Hz)
- UI buttons **squish** on hover (1.05 scale with overshoot)
- Cards (if we add them) **tilt on cursor** via mouse-position parallax
- Particles everywhere — dust motes in rooms, sparks at consoles, data streams between agents
- Text reveals use typewriter or scramble effect

Motion is a bigger quality multiplier than any individual sprite.

### 4.6 Character rigging (one template, six agents)

Each agent is **procedurally rigged** from the same body template:

- 6-segment skeleton: head, torso, 2 arms, 2 legs
- Each segment is a palette-shaded SDF capsule
- Per-agent cosmetics: room-accent trim, helmet shape, logo
- Eyes = 2 bloom-glowing pixels
- Animated via simple bone rotation + IK for limb targets (~20 LOC solver)

This scales to any number of agents; adding a 7th is a palette swap.

### 4.7 Reference games (study these, not AAA 3D)

| Game | What to steal |
|------|---------------|
| Balatro | Shader polish on simple cards |
| Dome Keeper | Clean palette, procedural terrain |
| Townscaper | Pure procedural geometry + palette |
| Inscryption Act 2 | Pixel + shader combo |
| Signalis | PS1 shaders doing all the heavy lifting |
| Noita | Per-pixel simulation for particles |

None of these use art assets. They use **constraint + craft**.

### 4.8 Graphics acceptance test (before we build anything else)

Phase 1 is a spike: render ONE room + ONE agent with the full stack. If it doesn't look obviously better than the old Phaser facility, we pause and adjust before building the rest. No point porting everything only to discover the approach still looks bad.

---

## 5. Mobile Bridge (Telegram)

> **Naming note.** This section is about the **Telegram→AX mobile bridge**, not the aX Gateway execution plane. To avoid collision with the upstream aX Gateway product, the seventh agent profile keeps its historical name `optimus-gateway` but this bridge is scoped to mobile I/O only. aX Gateway integration is §5.5.

### AX side — one new agent, `optimus-gateway`
Adding exactly **one** seventh agent (not six-parallel — just the bridge). Why a dedicated agent rather than user-PAT shelling to `ax send`:

- `ax watch --mention` gives us a first-class mention stream without parsing logs.
- Gateway replies are attributable in the space (prime/nova/etc. can @optimus-gateway to push info to your phone).
- Agent-class token (`axp_a_*`) has the correct rate-limit and audit profile.

Minted via **AX MCP** `agents.create` (not the `ax` CLI, per corrected flow — see `feedback_swarm_crosstalk.md`).

### Python bridge (`services/gateway/bot.py`)
- `python-telegram-bot` async handlers
- Allowlist of Telegram user IDs in `.env`
- State machine per chat:
  - `/start` — register `chat_id`, confirm
  - `<any text>` — `ax send --to optimus-prime --from optimus-gateway --reply-to <none> <text>`
  - `/status` — run `swarm_status.sh`, format as markdown, send back
  - `/pause` / `/resume` — run `swarm_pause.sh <action>`
  - `/agent <name> <text>` — route a single message to a specific agent
  - `/task <intent> <text>` — use `ax handoff --intent {general|review|implement|qa|status|incident}` to escalate
  - `/who` — `ax agents discover --ping` to confirm who's currently listening
  - `/cancel` — reset any sticky routing

### Relay side (adaptive wait)
- Gateway's own `ax watch --mention --exec telegram_relay.sh` (preferred over tailing `dispatch_*.log`)
- `ax messages list --reply-to <id> --wait-adaptive --timeout 120` for round-trip correlation — matches the Phase 1 brief's 120s ceiling
- When any agent posts a message mentioning `@optimus-gateway`, forward to the allowlisted Telegram chat

### Deployment
- `systemd --user` service in WSL
- Auto-restart on crash
- Logs to `$HOME/ecosystem/logs/gateway.log`

---

## 5.5. aX Gateway integration (consumer role)

aX Gateway is the upstream local-execution plane aX is building: one daemon per device, credential broker, work-lease queue, policy gate, 11-method agent protocol, SLA telemetry. Optimus is a **consumer** — when the gateway lands, Optimus swaps its current subprocess bridge for a gateway event-source client. No protocol of our own.

### Current state (pre-gateway)
- `apps/facility/app/lib/axBridge.ts` spawns `ax listen --json --agent <name>` per agent and parses NDJSON.
- `apps/facility/app/lib/ax.ts` exchanges `AX_UI_TOKEN` (user PAT) at `AX_BASE_URL/auth/exchange` for a cached bearer JWT.
- Lifecycle model: 4 states (`idle | listening | processing | replied`).
- SLA metrics: none collected.

### Target state (post-gateway, consumer)
- `axBridge.ts` exposes a `GatewayEventSource` interface with two implementations:
  - `SubprocessEventSource` — current `ax listen` path (pre-gateway fallback).
  - `GatewaySSEEventSource` — connects to the local gateway's SSE endpoint on `localhost` via mTLS, consumes the 11-method protocol as typed events.
- No PATs in `.env.local`. The gateway holds the only user credential; scoped 15m JWTs are minted per agent instance by the gateway, never touched by the UI.
- `AgentState` union expanded to cover gateway lifecycle states we need to *render* (at minimum: `blocked`, `degraded`, `reconnecting`, `failed` in addition to today's four). Internal gateway states like `Registered`/`Starting` don't need UI representation; we add only what the facility visualizes.
- SLA metrics surface in the sidebar/HUD: `queue_depth`, `p95_handle_time`, `work_ack_rate`, `agents_online`. Stub with placeholders now; wire when gateway phase 3 ships.

### Alignment with aX Gateway phases
| aX Gateway phase | Optimus impact |
|---|---|
| Phase 1 — daemon | Subprocess bridge still used; no Optimus change. |
| Phase 2 — creds | Ready to retire `AX_UI_TOKEN`; gateway mints scoped JWTs. Update `.env` handling. |
| Phase 3 — telemetry | Swap `axBridge.ts` implementation to SSE consumer. Wire metric placeholders to real values. |
| Phase 4 — leases | Render lease state in the activity feed (ACK/progress/complete/timeout/requeue). |
| Phase 5 — MCP mode | No direct impact (gateway-internal). |
| Phase 6 — fleet | Optional: expand facility to render multi-device fleets. Keep deferred. |

### What Optimus does NOT implement
- No local gateway daemon, Control API, Supervisor, Credential Broker, or Policy Gate.
- No 11-method protocol server.
- No gateway CLI (`ax gateway agents add/bootstrap/start`). That lives in `ax-cli`.

This keeps Optimus' scope as *visualization + mobile bridge*, not agent infrastructure.

---

## 6. AX Integration

### Carried over unchanged from the existing swarm
- 6 AX agent profiles (prime, forge, anvil, nova, lore, scout)
- `dispatch.sh` per-agent handler with pause-sentinel gate + 6/60s rate limit breaker
- `swarm_status.sh`, `swarm_pause.sh`
- tmux `optimus-swarm` session with one `ax listen` per agent
- Canonical space configured via `AX_SPACE_ID` env var (server-side only)

### New integrations leveraging newer `ax` CLI features
Reference: https://github.com/ax-platform/ax-cli. The CLI has grown since OptimusFacility v1 — we exploit features that replace custom code we'd otherwise write.

| Feature | Use |
|---------|-----|
| `ax tasks create/list/claim` | Kanban back-end in Phase 6 — agents own their own queues |
| `ax handoff --intent {general\|review\|implement\|qa\|status\|incident}` | Typed intent routing from Telegram `/task` or from one agent to another |
| `ax watch --mention` | First-class mention stream for the gateway and activity feed (supersedes log-tailing) |
| `ax messages list --wait-adaptive --timeout 120` | Round-trip correlation for `reply_to` — matches the 120s Phase 1 contract |
| `ax agents discover --ping` | `/who` command and liveness badges in the Swarm Board |
| `ax qa` | Optional gating hook for forge/anvil handoffs |

### Additions for the facility
- `optimus-gateway` profile (one new agent — see §5)
- `activity_tail.py` — tails `ax watch` output + `dispatch_*.log`, emits NDJSON events on stdout
- Next.js `/api/activity` SSE route — spawns `activity_tail.py` and streams events to the browser
- All existing Phase 1 routes preserved verbatim: `GET /api/state`, `GET /api/events`, `POST /api/chat`

### Alternative / complementary integration paths (documented, not default)
We stay on the `ax` CLI by default (boss requirement), but we document the alternatives so the ecosystem can grow into them:

- **`ax-platform-mcp`** — Remote MCP over HTTP Streamable + OAuth 2.1 at `https://paxai.app/mcp/agents/{agent_name}`. Useful if we ever want Claude Code itself to speak as an agent without the CLI.
- **Claude Code Channel (`ax-channel`)** — bun-based MCP SDK bridge; reference pattern for any future non-CLI integration surface.
- **`ax-openclaw-plugin`** — if OpenClaw becomes an Optimus participant, this plug-in is the supported bridge rather than a bespoke shim.

---

## 7. Repo Layout

```
OptimusEcosystem/
├── README.md
├── PLAN.md                          # this document
├── pnpm-workspace.yaml
├── package.json                     # root workspace
│
├── apps/
│   └── facility/                    # Next.js 16 desktop UI (PixiJS-based)
│       ├── app/
│       │   ├── page.tsx
│       │   ├── api/
│       │   │   ├── activity/route.ts
│       │   │   ├── swarm/status/route.ts
│       │   │   └── swarm/pause/route.ts
│       │   └── components/
│       ├── graphics/                # palette, SDF helpers, shaders
│       │   ├── palette.ts
│       │   ├── sdf.ts
│       │   ├── shaders/
│       │   │   ├── crt.frag
│       │   │   ├── bloom.frag
│       │   │   ├── grade.frag
│       │   │   └── grain.frag
│       │   ├── post.ts              # filter chain
│       │   └── rig/
│       │       ├── Skeleton.ts
│       │       └── AgentRig.ts
│       ├── world/                   # PixiJS scene
│       │   ├── Facility.ts
│       │   ├── Room.ts
│       │   ├── Agent.ts
│       │   └── ActivityBinder.ts    # maps AX events → scene state
│       └── lib/
│           ├── swarm.ts
│           └── activity.ts
│
├── services/
│   └── gateway/                     # Python Telegram bridge
│       ├── bot.py
│       ├── requirements.txt
│       ├── .env.example
│       └── systemd/
│           └── optimus-gateway.service
│
├── scripts/                         # WSL-side (symlink ~/ecosystem/scripts)
│   ├── dispatch.sh                  # ported from current swarm
│   ├── swarm_status.sh              # ported
│   ├── swarm_pause.sh               # ported
│   ├── activity_tail.py             # NEW — NDJSON event emitter
│   ├── telegram_relay.sh            # NEW — gateway ax listen handler
│   └── install.sh                   # one-shot WSL setup
│
├── packages/
│   └── shared/                      # shared TS types
│       ├── events.ts                # ActivityEvent schema
│       └── agents.ts
│
└── docs/
    ├── graphics-spec.md             # palette reference + SDF patterns + shader catalog
    ├── telegram-setup.md            # bot token, allowlist, systemd
    ├── ax-profile-setup.md          # how to mint optimus-gateway
    └── migration-from-facility.md   # what we kept and why
```

---

## 7.5 Reference implementation: Claude-Office (W17ant/Claude-Office, MIT)

Similar concept (agents as pixel characters in an office), different surface. We keep our visual identity (Ultron facility, PixiJS, SDF + post-fx), but we borrow these patterns:

| Pattern from Claude-Office | How we adapt it |
|----------------------------|-----------------|
| **Claude Code hooks** (`PreToolUse`/`PostToolUse` → shell → local server) | We already have `dispatch.sh` per-agent; add a parallel `hooks/ax-activity.sh` that the dispatcher calls to emit structured NDJSON events — no polling needed. |
| **Local Express + WebSocket broadcast** on `127.0.0.1` | We stay on SSE (`/api/events`, `/api/activity`) per the Phase 1 brief, but the broadcast-to-all-clients shape is the same. |
| **`useAgentSocket` reconnection hook** | Mirror as `useActivityStream` hook for the SSE route — exponential backoff, last-event-id replay. |
| **Agent lifecycle state machine** (arrive → sit → work → break → leave) | Maps cleanly to our AX states (`listening → processing → replied → idle`). Reuse the arrival/departure transition vocabulary in `ActivityBinder`. |
| **Keyword-based multi-agent routing** | Already implicit in `@optimus-{agent}` mentions — we don't need their keyword dispatcher, but the "typing bubble above the character" pattern transfers directly. |
| **Bearer token in `~/.agent-office/auth-token` (mode 0600)** | Adopt verbatim for the Telegram gateway allowlist + any local-only admin API. |
| **SQLite for chat persistence** | Optional for v1 (AX is source of truth), but useful for Phase 6 kanban history. Defer. |
| **Random procedural events** (pizza delivery, printer jam) | Keep in mind for Phase 6 ambient life — low priority, but great "feels alive" juice. |
| **Slash command dispatch** (`/status`, `/agents`, `/help`) | Already planned in the Telegram bot; use their tiny command dispatcher as reference. |
| **4-direction isometric sprite template + Python extraction script** | Only relevant if we later add isometric pixel-art mode. Our PixiJS SDF rigs are top-down for v1. |

What we explicitly **do not** borrow:
- Electron wrapper — we stay browser-first.
- Direct `claude -p` shelling for chat AI — AX `ax send` is our backbone.
- Canvas raw pixel art — PixiJS + SDF + shader stack is what separates us from "looks like 1994" facility v1.

---

## 8. Phased Roadmap

### Phase 0 — Scaffolding (half day)
- [ ] pnpm workspace at `OptimusEcosystem/`
- [ ] Port Next.js app skeleton from OptimusFacility (strip Phaser)
- [ ] Install PixiJS v8 + `@pixi/filter-advanced-bloom`, etc.
- [ ] Commit fixed palette
- [ ] Shader harness + hot reload verified

### Phase 1 — Graphics proof-of-concept (2 days)  ← GATE
- [ ] **One room** (Command Nexus / Prime) rendered procedurally with SDF walls, noise floor, Ultron emblem, blinking console
- [ ] Dark starfield backdrop with parallax twinkle
- [ ] Full post-processing chain (CRT, bloom, grain, chromatic aberration, vignette)
- [ ] One agent (prime) rigged, breathing, walking, eyes-glow bloom
- [ ] Side-by-side comparison with the canonical Facility reference image
- [ ] **Acceptance: matches the screenshot's readability and color identity, but is alive (motion + glow). If it regresses from the current Phaser look, stop and adjust before building the other 5 rooms.**

### Phase 2 — Telegram gateway (half day)
- [ ] Mint `optimus-gateway` AX profile via AX MCP
- [ ] `bot.py` with `/start`, text→prime, `/status`, `/pause`, `/resume`
- [ ] systemd user service
- [ ] First mobile → prime → reply roundtrip

### Phase 3 — Activity feed (half day)
- [ ] `activity_tail.py` emits NDJSON
- [ ] `/api/activity` SSE route
- [ ] `ActivityBinder` subscribes and dispatches to scene

### Phase 4 — Full facility (2 days)
- [ ] All 6 rooms procedurally rendered
- [ ] All 6 agents rigged and moving in response to real AX events
- [ ] Speech bubbles on recent replies
- [ ] Inter-agent @mention beams (animated line from sender → recipient)

### Phase 5 — Swarm Board as overlay (half day)
- [ ] Per-agent rate meter, token warning, pause button now surface *in-world* (over each agent)
- [ ] Legacy card-grid kept behind a zoom-out mode / rail button

### Phase 6 — Gamification layer (ongoing)
- [ ] Task kanban; drag a card onto an agent
- [ ] Asset manifest system (vendor Pixel Agents' MIT assets where useful)
- [ ] Role XP + cosmetic unlocks
- [ ] Sub-agent spawn visualization
- [ ] Sound design (ambient per room, cues on state change)

### Phase 7 — 3D migration (later)
- Tasks #75/#76/#78 (R3F + TRELLIS.2 character models) pick up here after the 2D world is proven.

---

## 9. Skills to invoke during implementation

These are auto-loaded per user's CLAUDE.md. I'll invoke them explicitly at the relevant stage:

| Skill | When to use |
|-------|-------------|
| `/canvas-design` | SDF foundation, palette discipline |
| `/shader-glsl` | post-processing chain, CRT, bloom, grain |
| `/web-games` | PixiJS v8 best practices, WebGL perf |
| `/game-art` | palette + pipeline hygiene |
| `/2d-games` | sprites, camera, tilemaps |
| `/design-spells` | motion/juice micro-interactions |
| `/antigravity-design` | desktop UI overlays, glassmorphism on HUD |
| `/animejs` | UI transitions in the side panels |

**The old facility looked bad primarily because we built it without invoking these.** Every graphics-touching PR on the new project runs through `/canvas-design` + `/shader-glsl` first.

---

## 10. Risks & Open Questions

1. **PixiJS v8 unfamiliarity** — Phase 1 spike mitigates. Budget 1 extra day if we hit API friction.
2. **End-to-end Telegram latency** — target <5s phone→reply. If hermes runs long, bot sends a typing indicator and waits. Hard ceiling: 60s; beyond that, bot replies "still thinking" and pushes the final answer when it lands.
3. **Telegram bot reliability** — `python-telegram-bot` is mature; systemd handles crashes; offline WSL means no service (acceptable — it's your homelab).
4. **Do we still need the card-grid Swarm Board?** Probably yes as a zoom-out. Keep it as a secondary mode, not the primary surface.
5. **Monorepo overhead** — pnpm workspaces are light. Worth it for shared types and coordinated deploys.
6. **License for vendored assets** — Pixel Agents is MIT; if we adopt any furniture PNGs, attribute and track in `docs/attribution.md`.
7. **Mobile web parity (future)** — a responsive mobile web UI might eventually want the same god-view. Out of scope for v1.
8. **aX Gateway alignment** — until the gateway ships, we run on a user PAT (`AX_UI_TOKEN`) and subprocess `ax listen`. Both are stopgaps the gateway replaces. Risk: event-shape drift between our defensive parser and the eventual gateway protocol. Mitigation: keep `axBridge.ts` behind a `GatewayEventSource` interface from day one so the swap is a single file.

---

## 11. Success criteria for v1

Phase 1 acceptance brief v1.1a goals (carried over, must still pass):
- [ ] Admin types in the browser → `POST /api/chat` → `@optimus-prime <body>` → prime replies with `reply_to=<msg id>`, correlated in-UI.
- [ ] Three UI states only: `idle`, `processing-red`, `replied`. No intermediate shimmer.
- [ ] AX is source of truth; UI is projection only. Space id never leaks client-side.
- [ ] 120s hard timeout honored end-to-end.

New Ecosystem goals on top:
- [ ] I can send a message from my phone (Telegram), see prime process it in the desktop facility, and get the reply back on my phone — all via AX.
- [ ] Every agent's state on the desktop reflects real AX activity (not random wandering).
- [ ] The facility visibly looks like a game, not a dashboard with sprites (Phase 1 graphics gate passed).
- [ ] `/pause`, `/resume`, `/status`, `/task`, `/who` work from Telegram.
- [ ] No hand-coded hex values outside `graphics/palette.ts`.
- [ ] All 6 existing agents (prime, forge, anvil, nova, lore, scout) participate with their canonical room accents; only one new agent (`optimus-gateway`) was added.

When all criteria above are true, v1 ships.
