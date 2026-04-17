<div align="center">

```
  ██████╗ ██████╗ ████████╗██╗███╗   ███╗██╗   ██╗███████╗
 ██╔═══██╗██╔══██╗╚══██╔══╝██║████╗ ████║██║   ██║██╔════╝
 ██║   ██║██████╔╝   ██║   ██║██╔████╔██║██║   ██║███████╗
 ██║   ██║██╔═══╝    ██║   ██║██║╚██╔╝██║██║   ██║╚════██║
 ╚██████╔╝██║        ██║   ██║██║ ╚═╝ ██║╚██████╔╝███████║
  ╚═════╝ ╚═╝        ╚═╝   ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝
                    E C O S Y S T E M
```

### A gamified living-world dashboard for the AX-powered Optimus agent swarm.

**Your phone is the command line. The desktop is the god-view.**

<br />

[![License: MIT](https://img.shields.io/badge/license-MIT-C1121F?style=for-the-badge&labelColor=020304)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-020304?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=020304)](https://nextjs.org/)
[![PixiJS v8](https://img.shields.io/badge/PixiJS-v8-E91E63?style=for-the-badge&labelColor=020304)](https://pixijs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=020304)](https://www.typescriptlang.org/)
[![Phase 0](https://img.shields.io/badge/phase-0_scaffolding-45D6FF?style=for-the-badge&labelColor=020304)](./PLAN.md)

🟥 `prime` &nbsp; 🟧 `forge` &nbsp; 🟦 `anvil` &nbsp; 🟪 `nova` &nbsp; 🟩 `lore` &nbsp; 🟦 `scout`

[**Quick Start**](#-quick-start) ·
[**How It Works**](#-how-it-works) ·
[**Environment**](#-environment-variables) ·
[**Troubleshooting**](#-troubleshooting) ·
[**Design Doc**](./PLAN.md)

</div>

---

## 🎯 Why this exists

Most agent swarms give you a terminal. That's fine for engineers. It's terrible for **feeling** what six agents are doing at 2am while you're on the couch.

Optimus Ecosystem splits the problem into **two surfaces, one protocol**:

|    | Surface | Role |
|----|---------|------|
| 📱 | **Mobile (Telegram)** | Command line, reborn as a chat. Write to the swarm from anywhere. |
| 🖥️ | **Desktop (facility UI)** | Observability surface. *Watch* the swarm work in a procedurally-rendered Ultron-style facility that reacts to real AX events in real time. |

Both talk to the same backbone — [AX Platform](https://next.paxai.app) + the `ax` CLI. No parallel protocols, no second auth layer, no message bus to maintain.

> [!NOTE]
> **The desktop is never the input device. The phone is never the display.** That split makes each side simpler.

---

## 🤖 The Swarm

Six AX agents. Six procedural rooms. One locked color palette.

| Agent | Role | Accent |
|-------|------|:------:|
| `optimus-prime` | Facility Commander | <img alt="#C1121F" src="https://img.shields.io/badge/-%23C1121F-C1121F?style=flat-square&labelColor=C1121F" height="18"/> |
| `optimus-forge` | Build Engineer | <img alt="#D4880F" src="https://img.shields.io/badge/-%23D4880F-D4880F?style=flat-square&labelColor=D4880F" height="18"/> |
| `optimus-anvil` | Systems Architect | <img alt="#6B8299" src="https://img.shields.io/badge/-%236B8299-6B8299?style=flat-square&labelColor=6B8299" height="18"/> |
| `optimus-nova`  | Research Lead | <img alt="#9B59D0" src="https://img.shields.io/badge/-%239B59D0-9B59D0?style=flat-square&labelColor=9B59D0" height="18"/> |
| `optimus-lore`  | Archive Librarian | <img alt="#059669" src="https://img.shields.io/badge/-%23059669-059669?style=flat-square&labelColor=059669" height="18"/> |
| `optimus-scout` | Signals Operator | <img alt="#45D6FF" src="https://img.shields.io/badge/-%2345D6FF-45D6FF?style=flat-square&labelColor=45D6FF" height="18"/> |

---

## 🧬 How it works

```
   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │   📱 Telegram    │────────▶│   🛰️  AX Platform │◀────────│   🖥️  Facility UI │
   │     gateway      │         │    (ax CLI)      │         │  apps/facility   │
   └──────────────────┘         └──────────────────┘         └──────────────────┘
            ▲                            ▲                            │
            │                            │                            ▼
            └──────────── you ───────────┘                   PixiJS v8 renderer
                                                          (procedural SDF rooms
                                                           + CRT + bloom + grain)
```

Three invariants you can rely on:

- 🟢 **AX is the source of truth.** The UI is a state projection layer, never a parallel store.
- 🟢 **Reply correlation via `reply_to`** — no content sniffing, no polling hacks.
- 🟢 **120s hard timeout** on any round-trip; beyond that we show a "still thinking" fallback.

---

## 🧰 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

**Monorepo**
- pnpm 9 workspaces
- Node ≥ 20
- TypeScript 5

</td>
<td valign="top" width="33%">

**Frontend**
- Next.js 16 (App Router + Turbopack)
- React 19
- Tailwind 4
- Zustand 5

</td>
<td valign="top" width="33%">

**Rendering**
- PixiJS v8
- `pixi-filters` · `pixi-viewport`
- GSAP 3.13
- `lucide-react`

</td>
</tr>
</table>

---

## 🚀 Quick Start

> [!TIP]
> **Zero config required.** The app runs in **mock mode** out of the box — agents echo replies locally so you can work on the UI without an AX account or burning quota.

### 30-second install

```bash
git clone https://github.com/<your-org>/OptimusEcosystem.git
cd OptimusEcosystem
pnpm install
pnpm dev
```

Open **<http://localhost:3100>** → Ultron-style facility, six rooms, one per agent. Type `@prime hello` in the comms feed and you'll get a mock reply.

✅ **That's it.** Everything below is optional.

---

### Step-by-step install

<details>
<summary><b>🧱 Prerequisites</b> — click to expand</summary>

<br />

| Requirement | Check | Install |
|-------------|-------|---------|
| **Node.js ≥ 20** | `node --version` | [nodejs.org](https://nodejs.org/) |
| **pnpm 9** | `pnpm --version` | `npm install -g pnpm@9` |
| **Git** | `git --version` | [git-scm.com](https://git-scm.com/) |

Optional — only if you want to connect to a real AX space:

| Optional | Purpose |
|----------|---------|
| [`ax` CLI](https://github.com/ax-platform/ax-cli) | Subprocess bridge for `ax listen` / `ax send` |
| [paxai.app](https://next.paxai.app) account | Upstream space + six agent profiles (`axp_a_*`) |

</details>

<details open>
<summary><b>1️⃣ Clone the repo</b></summary>

<br />

```bash
git clone https://github.com/<your-org>/OptimusEcosystem.git
cd OptimusEcosystem
```

</details>

<details open>
<summary><b>2️⃣ Install dependencies</b></summary>

<br />

```bash
pnpm install
```

This resolves the entire workspace (`apps/facility`, `packages/shared`). First install is ~30 seconds on a warm cache.

> [!NOTE]
> We ship a committed `pnpm-lock.yaml` for reproducible builds. Don't delete it.

</details>

<details open>
<summary><b>3️⃣ Configure environment</b> <sub><i>(optional — skip for mock mode)</i></sub></summary>

<br />

Copy the template and fill in your AX credentials:

```bash
cp apps/facility/.env.example apps/facility/.env.local
```

Edit `apps/facility/.env.local`:

```ini
# Required for live mode
AX_BASE_URL=https://next.paxai.app
AX_SPACE_ID=<your-space-uuid>
AX_UI_TOKEN=<your-ui-token>

# Optional — only for the live `ax listen` / `ax send` bridge
AX_TOKEN=<cli-token-or-empty-if-using-ax-auth-login>
AX_BIN=ax
AX_ENABLED=auto
```

> [!WARNING]
> **Never commit `.env.local`.** It's gitignored, but if you override the gitignore you'll leak tokens. Treat these values like passwords.

</details>

<details open>
<summary><b>4️⃣ Start the dev server</b></summary>

<br />

```bash
pnpm dev
```

You should see:

```
  ▲ Next.js 16.2.3 (Turbopack)
  - Local:        http://localhost:3100
  - Network:      http://0.0.0.0:3100
  ✓ Ready in 1.2s
```

Open **<http://localhost:3100>** 🎉

</details>

<details>
<summary><b>5️⃣ Production build</b> <sub><i>(for deploys)</i></sub></summary>

<br />

```bash
pnpm build
pnpm --filter @optimus/facility start
```

The production server starts on the same port (3100) by default. Set `PORT=` to override.

</details>

---

## 📦 Project Structure

```
OptimusEcosystem/
├── apps/
│   └── facility/              🖥️  Next.js 16 + PixiJS v8 desktop UI
│       ├── app/
│       │   ├── api/           ↳ /chat /events /projects /tasks /ax/status
│       │   ├── components/    ↳ GroupComms, LeftRail, AgentProfileModal
│       │   ├── lib/           ↳ ax.ts, axBridge.ts, orchestrator.ts, store.ts
│       │   ├── state/         ↳ Zustand stores
│       │   └── world/         ↳ PixiJS scene — rooms, agents, props, FX
│       ├── graphics/          🎨 Locked color palette (no ad-hoc hex)
│       └── public/assets/     🖼️  Agent portraits, room thumbnails
├── packages/
│   └── shared/                📦 Shared TypeScript types + agent registry
├── services/
│   └── gateway/               📱 Python Telegram bridge   (Phase 2, planned)
├── scripts/                   🐚 WSL dispatch + activity tailer   (Phase 3, planned)
├── docs/                      📘 Design-spec markdown
├── PLAN.md                    📋 The master design document
└── README.md                  👋 You are here.
```

---

## 📜 Scripts

Run from the repo root. All commands delegate to the right workspace.

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start `apps/facility` on port **3100** with Turbopack HMR |
| `pnpm build` | Production build of `apps/facility` |
| `pnpm lint` | Lint every workspace package |
| `pnpm --filter @optimus/facility typecheck` | TypeScript no-emit check |
| `pnpm --filter @optimus/facility start` | Serve the production build |

---

## 🔐 Environment Variables

All AX vars are **optional**. Missing credentials → mock mode (no external calls).

| Var | Default | Purpose |
|-----|---------|---------|
| `AX_BASE_URL` | *(empty)* | AX platform base URL, e.g. `https://next.paxai.app` |
| `AX_SPACE_ID` | *(empty)* | Your canonical AX space UUID |
| `AX_UI_TOKEN` | *(empty)* | UI-class token used for `/auth/exchange` |
| `AX_TOKEN` | *(empty)* | CLI-class token for the `ax listen` / `ax send` bridge |
| `AX_BIN` | `ax` | Path to the `ax` binary if it's not on your `PATH` |
| `AX_ENABLED` | `auto` | `auto`, `on`, or `off` (force mock mode) |
| `NEXT_ALLOWED_DEV_ORIGINS` | *(empty)* | Comma-separated extra origins for `next dev` (LAN/tunnel IPs) |

> [!TIP]
> See [`apps/facility/.env.example`](./apps/facility/.env.example) for a copy-paste-ready template.

---

## 🎮 Operating Modes

<table>
<tr>
<th width="33%">🧪 Mock mode</th>
<th width="33%">🛰️  Live mode</th>
<th width="33%">🔗 Bridge mode</th>
</tr>
<tr>
<td valign="top">

**Default.** No env vars needed.

`/api/chat` uses a local mock that schedules per-agent replies.

Perfect for:
- UI iteration
- Shader tuning
- Offline demos

</td>
<td valign="top">

Set `AX_BASE_URL` + `AX_SPACE_ID` + `AX_UI_TOKEN`.

Messages forward to your real AX space via `/auth/exchange` → bearer JWT.

Replies stream back through SSE on `/api/events`.

</td>
<td valign="top">

Live mode **plus** the `ax` CLI subprocess mirror.

Set `AX_ENABLED=on` — the app spawns one `ax listen --json` per agent and mirrors outbound with `ax send`.

Two-way sync with the upstream space.

</td>
</tr>
</table>

Check the live bridge status inside the app: **#comms → ax** panel.

---

## 🛣️ Roadmap

See [PLAN.md §8](./PLAN.md) for the full story.

- [x] **Phase 0** — Scaffolding ✅
- [ ] **Phase 1** — Graphics proof-of-concept (one room, full post-FX chain) — *← current gate*
- [ ] **Phase 2** — Telegram gateway (`bot.py`, systemd, mobile → swarm roundtrip)
- [ ] **Phase 3** — Activity feed (NDJSON tailer → SSE → scene)
- [ ] **Phase 4** — All 6 rooms + agents rigged to real AX events
- [ ] **Phase 5** — Swarm board as in-world overlay
- [ ] **Phase 6** — Gamification (kanban, XP, procedural events)

---

## 🧯 Troubleshooting

<details>
<summary><b>Port 3100 is already in use</b></summary>

<br />

```bash
# Find the process
lsof -i :3100          # macOS/Linux
netstat -ano | findstr :3100   # Windows

# Or override
PORT=3200 pnpm dev
```

</details>

<details>
<summary><b><code>pnpm install</code> fails with <code>ERR_PNPM_UNSUPPORTED_ENGINE</code></b></summary>

<br />

You're on an older Node.js. Upgrade to Node 20+:

```bash
node --version          # check
nvm install 20 && nvm use 20   # if using nvm
```

</details>

<details>
<summary><b>AX requests return 401 / 403</b></summary>

<br />

- Double-check `AX_UI_TOKEN` is the **UI**-class token, not a CLI token.
- Confirm `AX_SPACE_ID` matches the space your UI token is authorized for.
- Hit `/api/ax/status` in your browser — it returns the live bridge probe result.

</details>

<details>
<summary><b>The <code>ax</code> CLI bridge never starts</b></summary>

<br />

- Run `ax agents list` manually in your shell. If that fails, run `ax auth login` first.
- Set `AX_BIN` to the absolute path if `ax` isn't on `PATH`.
- Watch the app's dev console — `axBridge.ts` surfaces spawn/exit errors verbatim.

</details>

<details>
<summary><b>HMR is slow on Windows / WSL2</b></summary>

<br />

Put the repo on the native WSL filesystem (`~/code/...`), not the mounted `/mnt/c/` drive. Turbopack's file watcher is dramatically faster on Linux-native paths.

</details>

---

## 🤝 Contributing

This is a personal project and isn't actively accepting contributions, but feel free to fork and riff.

If you open a PR, all three of these must pass:

```bash
pnpm lint
pnpm --filter @optimus/facility typecheck
pnpm build
```

---

## 📝 License

[MIT](./LICENSE) © 2026 Octavio Albuquerque

<br />

<div align="center">

**Built with 🔴 by the Optimus swarm.**
<sub>Watch them work.</sub>

<br />

[⬆ Back to top](#)

</div>
