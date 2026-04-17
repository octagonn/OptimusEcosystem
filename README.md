# Optimus Ecosystem

Gamified living-world dashboard for the AX-powered Optimus agent swarm.

- **Mobile** (Telegram) — command the swarm from your phone
- **Desktop** (facility UI) — watch the swarm work in a procedurally-rendered world
- **Backbone** — [AX Platform](https://next.paxai.app) + `ax` CLI

See [PLAN.md](./PLAN.md) for the full design.

## Status

**Phase 0 — scaffolding.** See PLAN §8 for the roadmap.

## Packages

| Path | Description |
|------|-------------|
| `apps/facility` | Next.js 16 + PixiJS v8 desktop UI |
| `services/gateway` | Python Telegram bridge *(planned)* |
| `packages/shared` | Shared TypeScript types |
| `scripts/` | WSL-side dispatch + activity tailer *(planned)* |

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind 4
- **Rendering**: PixiJS v8 · pixi-filters · pixi-viewport · GSAP
- **State**: Zustand
- **Runtime**: Node 20+

## Getting started

```bash
# 1. Install
pnpm install

# 2. Configure env (optional — app runs in mock mode without it)
cp apps/facility/.env.example apps/facility/.env.local
# edit apps/facility/.env.local with your AX credentials

# 3. Dev server (port 3100)
pnpm dev
```

Open <http://localhost:3100>. Without AX credentials the `/api/chat` route
falls back to a mock that echoes agent replies — useful for UI work without
burning AX quota.

## Environment variables

See [`apps/facility/.env.example`](./apps/facility/.env.example). All are
optional; missing credentials put the app in mock mode.

| Var | Purpose |
|-----|---------|
| `AX_BASE_URL` | AX platform base URL (e.g. `https://next.paxai.app`) |
| `AX_SPACE_ID` | Your canonical AX space UUID |
| `AX_UI_TOKEN` | UI-class token used for `/auth/exchange` |
| `AX_TOKEN` | CLI-class token (optional, for the `ax listen`/`ax send` bridge) |
| `AX_BIN` | Path to the `ax` binary (defaults to `ax` on `PATH`) |
| `AX_ENABLED` | `auto` (default), `on`, or `off` to force mock mode |
| `NEXT_ALLOWED_DEV_ORIGINS` | Comma-separated extra origins for `next dev` |

## Scripts

```bash
pnpm dev         # start apps/facility on :3100
pnpm build       # production build of apps/facility
pnpm lint        # lint all workspaces
```

## License

[MIT](./LICENSE)
