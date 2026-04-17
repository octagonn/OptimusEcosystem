/**
 * AX server bridge — wraps token exchange + base URL helpers.
 * All env vars optional; if missing, callers should fall back to mock mode.
 */
const AX_BASE_URL = process.env.AX_BASE_URL ?? "";
const AX_SPACE_ID = process.env.AX_SPACE_ID ?? "";
const AX_UI_TOKEN = process.env.AX_UI_TOKEN ?? "";

export function isAxConfigured(): boolean {
  return Boolean(AX_BASE_URL && AX_SPACE_ID && AX_UI_TOKEN);
}

let cachedJwt: { token: string; expiresAt: number } | null = null;

export async function getJwt(): Promise<string> {
  if (!isAxConfigured()) throw new Error("AX not configured");
  const now = Date.now();
  if (cachedJwt && cachedJwt.expiresAt > now + 30_000) {
    return cachedJwt.token;
  }
  const res = await fetch(`${AX_BASE_URL}/auth/exchange`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AX_UI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requested_token_class: "user_access",
      audience: "ax-api",
      scope: "messages tasks context agents spaces search",
    }),
  });
  if (!res.ok) {
    throw new Error(`AX auth exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  cachedJwt = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cachedJwt.token;
}

export const axUrl = (path: string) => `${AX_BASE_URL}${path}`;
export const spaceId = () => AX_SPACE_ID;
