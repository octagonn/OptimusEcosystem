"use client";

import { useEffect, useRef } from "react";
import { Application, Assets, Container, NoiseFilter, FederatedPointerEvent } from "pixi.js";
import { AdvancedBloomFilter, CRTFilter, GlowFilter, OutlineFilter } from "pixi-filters";
import { Viewport } from "pixi-viewport";
import { PALETTE } from "@/graphics/palette";
import { ROOM_SPECS } from "./rooms";
import { useGroupChat } from "@/app/state/groupChatStore";
import { useAgentProfile } from "@/app/state/agentProfileStore";
import type { AgentName } from "@optimus/shared";
import { drawStarfield } from "./Starfield";
import { buildAgentRig } from "./agents/AgentRig";
import { createNavigator, roomWaypoints, type NavigatorState } from "./agents/AgentNavigator";
import { createDustMotes } from "./fx/DustMotes";
import { buildCorridor, type Corridor } from "./Corridor";
import type { RoomShell } from "./rooms/RoomShell";
import type { Rig } from "./agents/AgentRig";

/**
 * FacilityStage — Phase 2.
 *
 * 2×3 room grid with connective corridors and per-room procedurally
 * rigged agents. Single Pixi scene; one bloom+CRT+grain stack for
 * the whole facility. Viewport-fit with a non-uniform scale factor.
 *
 * Skills threaded through:
 *   web-games §3   — single Application, batched Graphics
 *   canvas-design  — SDF-flavored composition, palette-locked
 *   shader-glsl    — bloom, CRT, grain chain
 *   game-art §4    — per-room motion timing bands
 *   design-spells  — every surface moves (wash, sweeps, sparks, radar)
 *   2d-games §4    — top-down, parallax starfield, viewport scaling
 */
export default function FacilityStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const app = new Application();
    appRef.current = app;

    (async () => {
      await app.init({
        background: PALETTE.bg,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: host,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);

      const W = app.renderer.width;
      const H = app.renderer.height;

      // ─── Preload agent sprites so first frame shows full characters ──
      // Rooms are procedural — no PNG backdrops to load.
      const agentPaths = ROOM_SPECS.map((s) => `/assets/agents/${s.assetKey}.png`);
      await Promise.all(agentPaths.map((p) => Assets.load(p).catch(() => null)));
      if (cancelled) {
        app.destroy(true);
        return;
      }

      // ─── Starfield backdrop (own layer, no world filter) ───
      const starfield = drawStarfield(W, H);
      app.stage.addChild(starfield.view);

      // Intrinsic grid dimensions
      const ROOM_W = 520;
      const ROOM_H = 340;
      const COL_GAP = 56;
      const ROW_GAP = 56;
      const COLS = 3;
      const ROWS = 2;
      const GRID_W = COLS * ROOM_W + (COLS - 1) * COL_GAP;
      const GRID_H = ROWS * ROOM_H + (ROWS - 1) * ROW_GAP;

      // Fit grid to screen (used as the viewport's initial zoom)
      const MARGIN = 32;
      const fitScale = Math.min(
        (W - MARGIN * 2) / GRID_W,
        (H - MARGIN * 2 - 48) / GRID_H,
      );

      // ─── Viewport camera (pixi-viewport) ─────────────────────
      // Replaces the hand-rolled pan/zoom with inertia, pinch, bounce, clamp-zoom.
      const viewport = new Viewport({
        screenWidth: W,
        screenHeight: H,
        worldWidth: GRID_W,
        worldHeight: GRID_H,
        events: app.renderer.events,
      });
      viewport
        .drag({ mouseButtons: "left" })
        .pinch()
        .wheel({ smooth: 6, percent: 0.12 })
        .decelerate({ friction: 0.94 })
        .clampZoom({ minScale: fitScale * 0.6, maxScale: fitScale * 4 });
      viewport.setZoom(fitScale, true);
      viewport.moveCenter(GRID_W / 2, GRID_H / 2);
      app.stage.addChild(viewport);
      const world = viewport as unknown as Container;

      // Build rooms — index by agent
      type RoomEntry = {
        room: RoomShell;
        agent: string;
        accent: number;
        gridCol: number;
        gridRow: number;
        originX: number;
        originY: number;
      };
      const rooms: RoomEntry[] = [];
      const rigs: Rig[] = [];
      // Parallel to `rigs`: nav state + room origin so the ticker can drive
      // each agent's position every frame.
      const navigators: Array<{ nav: NavigatorState; originX: number; originY: number }> = [];

      const WALL_THICK = 14; // mirrors RoomShell's wall band
      const SPEEDS: Record<string, number> = {
        // Personality in pacing — prime patrols briskly, lore plods, anvil steady.
        "optimus-prime": 30,
        "optimus-forge": 26,
        "optimus-anvil": 24,
        "optimus-nova": 28,
        "optimus-lore": 20,
        "optimus-scout": 32,
      };

      for (let specIdx = 0; specIdx < ROOM_SPECS.length; specIdx++) {
        const spec = ROOM_SPECS[specIdx];
        const room = spec.build();
        const originX = spec.gridCol * (ROOM_W + COL_GAP);
        const originY = spec.gridRow * (ROOM_H + ROW_GAP);
        room.view.position.set(originX, originY);
        world.addChild(room.view);

        // Dust motes confined to this room
        const dust = createDustMotes(ROOM_W, ROOM_H, 28);
        dust.view.position.set(originX, originY);
        world.addChild(dust.view);

        // Agent rig — starts at a waypoint and walks the room.
        // Lore is intentionally smaller (2/3) per art direction.
        const sizeScale = spec.assetKey === "lore" ? 2 / 3 : 1;
        const rig = buildAgentRig(spec.accentToken, spec.assetKey, sizeScale);

        const waypoints = roomWaypoints(ROOM_W, ROOM_H, WALL_THICK, specIdx + 1);
        const nav = createNavigator({
          waypoints,
          speed: SPEEDS[spec.agent] ?? 26,
          seed: (specIdx + 1) * 97_041,
        });
        rig.view.position.set(originX + nav.x, originY + nav.y);
        navigators.push({ nav, originX, originY });
        // Accent glow + dark outline so agents read against busy room art.
        rig.view.filters = [
          new OutlineFilter({ thickness: 2, color: 0x050812, quality: 0.6 }),
          new GlowFilter({
            distance: 14,
            outerStrength: 1.6,
            innerStrength: 0.15,
            color: PALETTE[spec.accentToken],
            quality: 0.35,
          }),
        ];
        world.addChild(rig.view);
        rigs.push(rig);

        // Click-to-chat: tap rig opens the agent chat modal.
        // Use 'pointertap' so viewport drag doesn't steal it.
        rig.view.eventMode = "static";
        rig.view.cursor = "pointer";
        // Generous hit area so tiny pixel-art sprites are easy to click.
        rig.view.hitArea = {
          contains: (x: number, y: number) => {
            return x >= -28 && x <= 28 && y >= -64 && y <= 8;
          },
        };
        const agentName = spec.agent as AgentName;
        rig.view.on("pointertap", (e: FederatedPointerEvent) => {
          e.stopPropagation();
          // Open the agent's profile card. The chat CTA inside the modal
          // is what actually seeds the comms composer.
          useAgentProfile.getState().open(agentName);
        });
        rig.view.on("pointerover", () => {
          rig.setProcessing(true);
        });
        rig.view.on("pointerout", () => {
          rig.setProcessing(false);
        });

        // Bundle dust tick into room tick
        const origRoomTick = room.tick;
        let dustT = 0;
        room.tick = (t: number) => {
          origRoomTick(t);
          const dt = t - dustT;
          dustT = t;
          dust.tick(t, Math.max(0, Math.min(0.1, dt)));
        };

        rooms.push({
          room,
          agent: spec.agent,
          accent: PALETTE[spec.accentToken],
          gridCol: spec.gridCol,
          gridRow: spec.gridRow,
          originX,
          originY,
        });
      }

      // ─── Corridors (horizontal between cols, vertical between rows) ──
      const corridors: Corridor[] = [];

      const getRoom = (col: number, row: number) =>
        rooms.find((r) => r.gridCol === col && r.gridRow === row)!;

      // Horizontal corridors — between adjacent columns in same row
      const corH = 36;
      const corHLen = COL_GAP;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 1; col++) {
          const left = getRoom(col, row);
          const right = getRoom(col + 1, row);
          const corridor = buildCorridor({
            length: corHLen,
            width: corH,
            axis: "horizontal",
            accentA: left.accent,
            accentB: right.accent,
            flowSpeed: 22,
          });
          corridor.view.position.set(left.originX + ROOM_W, left.originY + ROOM_H / 2 - corH / 2);
          world.addChild(corridor.view);
          corridors.push(corridor);
        }
      }

      // Vertical corridors — between rows in same column
      const corV = 36;
      const corVLen = ROW_GAP;
      for (let col = 0; col < COLS; col++) {
        const top = getRoom(col, 0);
        const bottom = getRoom(col, 1);
        const corridor = buildCorridor({
          length: corVLen,
          width: corV,
          axis: "vertical",
          accentA: top.accent,
          accentB: bottom.accent,
          flowSpeed: 20,
        });
        corridor.view.position.set(top.originX + ROOM_W / 2 - corV / 2, top.originY + ROOM_H);
        world.addChild(corridor.view);
        corridors.push(corridor);
      }

      // Re-add all room views on top of corridors so walls overlap seam ends
      for (const r of rooms) world.addChild(r.room.view);
      // And rigs on top of rooms
      for (const rig of rigs) world.addChild(rig.view);

      // ─── Filter chain (shader-glsl §Post) ──────────────────────
      const bloom = new AdvancedBloomFilter({
        threshold: 0.4,
        bloomScale: 1.1,
        brightness: 1.0,
        blur: 7,
        quality: 6,
      });
      world.filters = [bloom];

      const crt = new CRTFilter({
        curvature: 1.2,
        lineWidth: 1.0,
        lineContrast: 0.06,
        verticalLine: false,
        noise: 0.012,
        noiseSize: 1.0,
        vignetting: 0.22,
        vignettingAlpha: 0.6,
        vignettingBlur: 0.3,
        seed: 0.5,
        time: 0,
      });
      const grain = new NoiseFilter({ noise: 0.008, seed: Math.random() });
      app.stage.filters = [crt, grain];

      // ─── Live-activity hook ────────────────────────────────────
      // Pulse a rig + room beam when the orchestrator emits an
      // "activity" event for that agent (chat post, task transition).
      // pulseUntil[agent] is a wall-clock timestamp; ticker fades it.
      const pulseUntil: Record<string, number> = {};
      const PULSE_MS = 1_400;
      const rigByAgent = new Map<string, Rig>();
      ROOM_SPECS.forEach((s, i) => rigByAgent.set(s.agent, rigs[i]));
      const offActivity = useGroupChat.subscribe((state, prev) => {
        for (const [agent, ts] of Object.entries(state.activity)) {
          if (prev.activity[agent] !== ts) {
            pulseUntil[agent] = performance.now() + PULSE_MS;
            const rig = rigByAgent.get(agent);
            rig?.setProcessing(true);
          }
        }
      });

      // ─── Ticker ────────────────────────────────────────────────
      let t = 0;
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        t += dt;

        starfield.tick(t);
        for (const r of rooms) r.room.tick(t);
        for (const c of corridors) c.tick(t);

        // Advance each agent along its waypoint path, then paint.
        // Pixel rounding keeps pixel-art sprites crisp while moving.
        for (let i = 0; i < rigs.length; i++) {
          const rig = rigs[i];
          const n = navigators[i];
          n.nav.update(dt);
          rig.view.position.set(
            Math.round(n.originX + n.nav.x),
            Math.round(n.originY + n.nav.y),
          );
          rig.setWalking(n.nav.walking);
          rig.setFacing(n.nav.facing);
          rig.tick(t);
        }

        // Decay activity pulse — turn processing back off when expired
        const wall = performance.now();
        for (const [agent, until] of Object.entries(pulseUntil)) {
          if (wall >= until) {
            const rig = rigByAgent.get(agent);
            rig?.setProcessing(false);
            delete pulseUntil[agent];
          }
        }

        bloom.bloomScale = 1.02 + Math.sin(t * 1.2) * 0.15;
        crt.time = t * 0.25;
        crt.seed = (t * 0.13) % 1;
        grain.seed = Math.random();
      });

      // Stash for cleanup
      cleanupRef.current = () => offActivity();

      if (process.env.NODE_ENV !== "production") {
        console.log("[facility] alive — grid", GRID_W, "x", GRID_H, "fitScale", fitScale.toFixed(3));
      }
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      const a = appRef.current;
      if (a) {
        try {
          a.destroy(true, { children: true });
        } catch {
          /* noop */
        }
        appRef.current = null;
      }
      if (host) host.innerHTML = "";
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 pt-12" />;
}
