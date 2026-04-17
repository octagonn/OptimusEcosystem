import { Container, Graphics, Sprite, BlurFilter, Assets, Texture } from "pixi.js";
import { PALETTE, type PaletteToken } from "@/graphics/palette";

export interface Rig {
  view: Container;
  tick: (t: number) => void;
  setProcessing: (on: boolean) => void;
  setWalking: (on: boolean) => void;
  setFacing: (dir: -1 | 1) => void;
}

/**
 * Sprite-based Optimus agent. Feet are planted — no idle float. When
 * walking, the sprite gets an upward step-bounce keyed to a fixed step
 * frequency; the shadow stays put so the character reads as grounded.
 *
 * Sprite is anchored at (0.5, 1) so `view.position` = feet-on-floor.
 */
export function buildAgentRig(
  accentToken: PaletteToken,
  assetKey: string,
  sizeScale: number = 1,
): Rig {
  const view = new Container();
  const accent = PALETTE[accentToken];

  // Contact shadow under feet — scales with sprite so it stays grounded
  const shadow = new Graphics();
  shadow.ellipse(0, 0, 18 * sizeScale, 5 * sizeScale)
    .fill({ color: PALETTE.charcoal, alpha: 0.7 });
  view.addChild(shadow);

  // Accent rim halo (blurred additive) — bloom will catch this
  const halo = new Graphics();
  halo.blendMode = "add";
  halo.filters = [new BlurFilter({ strength: 6, quality: 3 })];
  view.addChild(halo);
  const haloMaxR = 30 * sizeScale;
  const haloStep = Math.max(1.5, 3 * sizeScale);
  const haloCY = -24 * sizeScale;
  const drawHalo = (k: number) => {
    halo.clear();
    for (let r = haloMaxR; r > 0; r -= haloStep) {
      const a = (1 - r / haloMaxR) * 0.22 * k;
      halo.ellipse(0, haloCY, r * 0.85, r * 1.3).fill({ color: accent, alpha: a });
    }
  };
  drawHalo(1);

  // Character sprite
  const path = `/assets/agents/${assetKey}.png`;
  const cached = (Assets.cache.get(path) as Texture | undefined) ?? Texture.EMPTY;
  const sprite = new Sprite(cached);
  sprite.anchor.set(0.5, 1);
  // Target on-screen height. Room is 340 tall — agent ~52px tall reads clean.
  const TARGET_H = 52 * sizeScale;
  // Base scale magnitude is captured after fit(); facing flips its sign.
  let baseScaleX = 1;
  const fit = (tex: Texture) => {
    if (tex === Texture.EMPTY || !tex.width) return;
    const ratio = tex.width / tex.height;
    sprite.height = TARGET_H;
    sprite.width = TARGET_H * ratio;
    baseScaleX = Math.abs(sprite.scale.x);
  };
  fit(cached);
  view.addChild(sprite);

  if (sprite.texture === Texture.EMPTY) {
    Assets.load(path)
      .then((tex) => {
        sprite.texture = tex as Texture;
        fit(tex as Texture);
        // Preserve facing after a late texture swap
        sprite.scale.x = baseScaleX * facing;
      })
      .catch(() => { /* noop */ });
  }

  let processing = false;
  let walking = false;
  let facing: -1 | 1 = 1;

  const tick = (t: number) => {
    // Walking: upward-only step bounce (never dips below feet-line).
    // Idle: planted — no vertical motion, no float.
    const bounce = walking
      ? -Math.abs(Math.sin(t * 7.5)) * 1.7 * sizeScale
      : 0;
    sprite.y = bounce;

    // Subtle lean into the walk direction for body-language
    sprite.rotation = walking ? Math.sin(t * 7.5) * 0.025 * facing : 0;

    // Keep facing in sync (cheap — same value if unchanged)
    sprite.scale.x = baseScaleX * facing;

    // Halo intensity — gentle breathing idle, strong pulse when processing
    const k = processing
      ? 0.9 + Math.abs(Math.sin(t * 4)) * 0.6
      : 0.5 + Math.sin(t * 1.1) * 0.25;
    drawHalo(k);
  };

  return {
    view,
    tick,
    setProcessing: (on: boolean) => { processing = on; },
    setWalking: (on: boolean) => { walking = on; },
    setFacing: (dir: -1 | 1) => { facing = dir; },
  };
}
