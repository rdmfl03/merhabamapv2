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
