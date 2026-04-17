import type { NextConfig } from "next";

// Add your LAN / tunnel origins here (or via NEXT_ALLOWED_DEV_ORIGINS, comma-separated)
// so Next.js dev server accepts non-localhost requests during development.
const extraOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: extraOrigins,
  transpilePackages: ["@optimus/shared"],
};

export default nextConfig;
