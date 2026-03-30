import "server-only";

function readMapTilerKeyFromEnv(): string {
  const candidates = [
    process.env.MAPTILER_API_KEY,
    process.env.MAPTILER_KEY,
    process.env.MAP_TILER_API_KEY,
  ];
  for (const raw of candidates) {
    const v = raw?.trim();
    if (v) {
      return v;
    }
  }
  return "";
}

/**
 * MapTiler key for server-side use only (layout + /api/map-tiles).
 * Set `MAPTILER_API_KEY` in Netlify secrets and in local `.env.local` — never commit values.
 * Aliases: `MAPTILER_KEY`, `MAP_TILER_API_KEY` (same secret, typo-tolerant).
 */
export function getMapTilerApiKeyForRequest(): string {
  return readMapTilerKeyFromEnv();
}

export function isMapTilerConfigured(): boolean {
  return Boolean(getMapTilerApiKeyForRequest());
}

function firstValidPublicAppBaseUrl(): string | null {
  const candidates = [
    process.env.APP_URL,
    process.env.AUTH_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];
  for (const raw of candidates) {
    const t = raw?.trim();
    if (!t) {
      continue;
    }
    try {
      const u = new URL(t);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return t.replace(/\/+$/, "");
      }
    } catch {
      /* ignore */
    }
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return null;
}

/**
 * MapTiler URL-restricted keys expect Referer/Origin. Server-side fetch has none by default,
 * which yields 403 and breaks Leaflet when the proxy forwards non-image error bodies.
 */
export function getMapTilerUpstreamFetchHeaders(): HeadersInit {
  const base = firstValidPublicAppBaseUrl();
  const headers: Record<string, string> = {
    Accept: "image/png,image/*",
    "User-Agent": "MerhabaMap/1.0 (tile-proxy)",
  };
  if (base) {
    try {
      headers.Referer = `${base}/`;
      headers.Origin = new URL(base).origin;
    } catch {
      /* ignore */
    }
  }
  return headers;
}
