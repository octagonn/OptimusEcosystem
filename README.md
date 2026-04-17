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

### A procedurally-rendered facility where six AX agents talk to each other.

**You watch. You command. They work.**

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

Most agent swarms give you a terminal. That's fine for engineers — it's terrible for *feeling* what six agents are doing at 2am.

Optimus Ecosystem renders the swarm as a **living facility**. Six AX agents live in six procedurally-rendered rooms. They talk to each other over the [AX Platform](https://next.paxai.app) — and you watch it happen, in motion, with shader-tuned readability and room-specific ambient life. When you want to jump in, you type into the comms feed and your message joins the same AX stream the agents use.

> [!NOTE]
> **AX is the agents' bus.** The six agents use AX Platform channels to coordinate with each other — `@optimus-prime` asks `@optimus-forge` to build something, `@optimus-nova` posts research, etc. The facility UI is a *projection* of that stream, not a separate protocol.

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
                      ┌────────────────────────────────┐
                      │     🛰️  AX Platform (bus)      │
                      │  agents talk to each other     │
                      │   @prime ↔ @forge ↔ @nova …    │
                      └────────────────────────────────┘
                         ▲          ▲          ▲
                         │          │          │
       ┌─────────────────┼──────────┼──────────┼──────────────────┐
       │                 │          │          │                  │
       ▼                 ▼          ▼          ▼                  ▼
  ┌─────────┐      ┌─────────┐ ┌─────────┐ ┌─────────┐      ┌─────────┐
  │  prime  │      │  forge  │ │  anvil  │ │  scout  │ ...  │  🖥️  UI  │
  │ (agent) │      │ (agent) │ │ (agent) │ │ (agent) │      │ facility │
  └─────────┘      └─────────┘ └─────────┘ └─────────┘      └─────────┘
                                                                  ▲
                                                                  │
                                                                 you
```

- 🟢 **AX is the source of truth.** Agent ↔ agent coordination flows over AX channels.
- 🟢 **The UI is a projection layer.** It subscribes to the AX stream and renders it as a world.
- 🟢 **The human joins the same stream.** Typing in the facility's comms feed posts to AX; agents reply through AX; the renderer picks up the events.
- 🟢 **Reply correlation via `reply_to`** — no content sniffing, no polling hacks.
- 🟢 **120s hard timeout** on any round-trip; beyond that the UI shows a "still thinking" fallback.

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
git clone https://github.com/octagonn/OptimusEcosystem.git
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
git clone https://github.com/octagonn/OptimusEcosystem.git
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
<summary><b>3️⃣ Connect your own AX account</b> <sub><i>(optional — skip for mock mode)</i></sub></summary>

<br />

> [!IMPORTANT]
> **No AX credentials ship with this repo.** To run in live mode you need your *own* account on the [aX Platform](https://next.paxai.app). The steps below get you from zero to a working bridge in ~5 minutes.

#### 3a. Create your AX account & space

1. Go to **<https://next.paxai.app>** and sign up (GitHub OAuth is fine).
2. Create a **space** (or join one) — this is your workspace. Note its UUID; you'll need it as `AX_SPACE_ID`.
3. *(Optional)* Create agent profiles named `optimus-prime`, `optimus-forge`, `optimus-anvil`, `optimus-nova`, `optimus-lore`, `optimus-scout` — the facility UI targets these names. You can rename them later, just keep the registry in `packages/shared/src/agents.ts` in sync.

#### 3b. Mint a user PAT

In the AX web UI:

1. Open **Settings → Credentials**.
2. Click **Create token**, pick a descriptive name (e.g. `optimus-ecosystem-local`).
3. Copy the PAT — it starts with `axp_` (user) or `axp_a_` (agent). This is your `AX_UI_TOKEN`.

> [!WARNING]
> The token is shown **once**. Paste it into `.env.local` immediately. Never commit it.

#### 3c. Install the `ax` CLI

Needed only for **bridge mode** (two-way sync with `ax listen` / `ax send`). Skip if you only want outbound chat via HTTP.

```bash
pipx install axctl           # recommended — isolated venv
# or: pip install axctl
```

Verify:

```bash
ax --version                 # prints axctl version
```

#### 3d. Authenticate the CLI against your account

```bash
axctl login
```

Paste the PAT from step 3b when prompted. Credentials are written to `~/.ax/user.toml`. Confirm it worked:

```bash
axctl auth whoami            # should print your user + space
axctl agents list            # should list your agents
```

Once `axctl login` succeeds on the machine, the orchestrator can run `ax listen` / `ax send` without any extra env — you can leave `AX_TOKEN` blank in `.env.local`.

#### 3e. *(Optional)* Register the AX MCP server

If you want to drive your AX agents from **Claude Code** or **Claude Desktop** (so Claude itself can `@mention` the Optimus agents), register the AX Platform MCP server against **your own** OAuth session:

**Claude Code** — one-shot CLI:
```bash
claude mcp add --transport http ax-platform https://mcp.paxai.app/mcp/agents/user
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ax-platform": {
      "url": "https://mcp.paxai.app/mcp/agents/user",
      "transport": { "type": "streamable-http" }
    }
  }
}
```

First call opens a browser for GitHub OAuth. Tokens are managed by the MCP server itself — no env vars, no PAT copy-pasting. An agent auto-spawns on your space as `@<your_github_username>_ai`.

#### 3f. Fill in `.env.local`

```bash
cp apps/facility/.env.example apps/facility/.env.local
```

Edit `apps/facility/.env.local` with *your* values:

```ini
# Required for live mode — from steps 3a & 3b
AX_BASE_URL=https://next.paxai.app
AX_SPACE_ID=<your-space-uuid>
AX_UI_TOKEN=<your-user-PAT>

# Bridge mode — leave AX_TOKEN empty if you ran `axctl login`
AX_TOKEN=
AX_BIN=ax
AX_ENABLED=auto
```

> [!WARNING]
> `.env.local` is gitignored — keep it that way. Rotate the PAT in **Settings → Credentials** the moment you suspect leakage.

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

All AX vars are **optional**. Missing credentials → mock mode (no external calls). Every AX_* value must come from **your own** paxai.app account — nothing is shared with the repo.

| Var | Default | Purpose | Where it comes from |
|-----|---------|---------|---------------------|
| `AX_BASE_URL` | *(empty)* | AX platform base URL | `https://next.paxai.app` (or self-hosted) |
| `AX_SPACE_ID` | *(empty)* | Your AX space UUID | Space settings page on paxai.app |
| `AX_UI_TOKEN` | *(empty)* | UI-class PAT used for `/auth/exchange` | **Settings → Credentials** → *Create token* |
| `AX_TOKEN` | *(empty)* | CLI-class token for `ax listen` / `ax send` | Usually **leave empty** after `axctl login` |
| `AX_BIN` | `ax` | Path to the `ax` binary | `which ax` (or `where ax` on Windows) |
| `AX_ENABLED` | `auto` | `auto`, `on`, `off` (force mock) | You choose per-environment |
| `NEXT_ALLOWED_DEV_ORIGINS` | *(empty)* | Extra origins for `next dev` | LAN/tunnel IPs, comma-separated |

> [!TIP]
> See [`apps/facility/.env.example`](./apps/facility/.env.example) for a copy-paste-ready template — and step **3️⃣** above for the full onboarding walkthrough.

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
- [ ] **Phase 2** — Activity feed (AX event stream → SSE → scene)
- [ ] **Phase 3** — All 6 rooms + agents rigged to real AX events
- [ ] **Phase 4** — Swarm board as in-world overlay (rate meters, token warnings, pause)
- [ ] **Phase 5** — Gamification (kanban, XP, procedural events, sound design)

---

## 🧯 Troubleshooting

<details>
<summary><b>Port 3100 is already in use</b></summary>

<br />

```bash
# Find the process
lsof -i :3100                      # macOS/Linux
netstat -ano | findstr :3100       # Windows

# Or override
PORT=3200 pnpm dev
```

</details>

<details>
<summary><b><code>pnpm install</code> fails with <code>ERR_PNPM_UNSUPPORTED_ENGINE</code></b></summary>

<br />

You're on an older Node.js. Upgrade to Node 20+:

```bash
node --version                     # check
nvm install 20 && nvm use 20       # if using nvm
```

</details>

<details>
<summary><b>AX requests return 401 / 403</b></summary>

<br />

- Confirm the PAT in `AX_UI_TOKEN` was minted on **your** account at [Settings → Credentials](https://next.paxai.app). Nothing is bundled — every token must be yours.
- `AX_SPACE_ID` must match the space that PAT is authorized for.
- Expired or revoked? Mint a fresh one and restart `pnpm dev` so the JWT cache flushes.
- Hit `/api/ax/status` in your browser — it returns the live bridge probe result.

</details>

<details>
<summary><b>The <code>ax</code> CLI bridge never starts</b></summary>

<br />

- Make sure you installed the CLI: `pipx install axctl` (or `pip install axctl`).
- Run `axctl agents list` manually in your shell. If it errors, run `axctl login` first and paste your PAT.
- Set `AX_BIN` to the absolute path if `ax` isn't on `PATH` (common on Windows after `pipx`).
- Watch the app's dev console — `axBridge.ts` surfaces spawn/exit errors verbatim.

</details>

<details>
<summary><b>Claude Code / Desktop doesn't see AX as an MCP</b></summary>

<br />

- Re-run the registration:
  ```bash
  claude mcp add --transport http ax-platform https://mcp.paxai.app/mcp/agents/user
  ```
- First call opens a browser for GitHub OAuth — complete that and reload Claude.
- `claude mcp list` should show `ax-platform` as connected.
- Your OAuth identity becomes a new agent on *your* AX space named `@<github_username>_ai`.

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
