import "server-only";

/**
 * MapTiler key for server-side use only (layout + /api/map-tiles).
 * Set `MAPTILER_API_KEY` in Netlify secrets and in local `.env.local` — never commit values.
 */
export function getMapTilerApiKeyForRequest(): string {
  return process.env.MAPTILER_API_KEY?.trim() ?? "";
}

export function isMapTilerConfigured(): boolean {
  return Boolean(getMapTilerApiKeyForRequest());
}
