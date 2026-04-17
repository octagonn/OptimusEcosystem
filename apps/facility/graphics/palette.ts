/**
 * Locked palette. Derived from the canonical Facility reference image.
 *
 * No hex values are permitted anywhere else in the codebase. If a new
 * color is needed, add a token here first. Max 32 tokens.
 */

export const PALETTE = {
  // Dark void / starfield
  void: 0x04060a,
  bg: 0x020304,

  // Steel neutrals (9 steps, cold gray-blue)
  steel900: 0x0b1220,
  steel800: 0x121a2b,
  steel700: 0x1a2233,
  steel600: 0x202b40,
  steel500: 0x2a3448,
  steel400: 0x3b4559,
  steel300: 0x5d6b82,
  steel200: 0x8a94a8,
  steel100: 0xbfc6d2,

  // Ivory / shadow
  ivory: 0xe5e7eb,
  charcoal: 0x0a0d12,

  // Per-agent room accents (canonical from Facility.ts ROOMS[])
  prime: 0xc1121f,
  forge: 0xd4880f,
  anvil: 0x6b8299,
  nova: 0x9b59d0,
  lore: 0x059669,
  scout: 0x45d6ff,

  // State signals
  ok: 0x22c55e,
  warn: 0xf59e0b,
  danger: 0xc1121f,
  hologramTeal: 0x2dd4bf,
  warningGold: 0xfbbf24,
} as const;

export type PaletteToken = keyof typeof PALETTE;

export const hex = (token: PaletteToken): number => PALETTE[token];

/** CSS hex string helper for DOM styles. */
export const css = (token: PaletteToken): string =>
  "#" + PALETTE[token].toString(16).padStart(6, "0");

/** Per-agent accent lookup. */
export const AGENT_ACCENT: Record<string, PaletteToken> = {
  "optimus-prime": "prime",
  "optimus-forge": "forge",
  "optimus-anvil": "anvil",
  "optimus-nova": "nova",
  "optimus-lore": "lore",
  "optimus-scout": "scout",
};
