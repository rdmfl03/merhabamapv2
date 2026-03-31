import "server-only";

function readStadiaKeyFromEnv(): string {
  const candidates = [
    process.env.STADIA_API_KEY,
    process.env.STADIA_MAPS_API_KEY,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

/**
 * Stadia key for server-side use only (layout + /api/map-tiles).
 * Set `STADIA_API_KEY` in local `.env.local` and production secrets — never commit values.
 */
export function getStadiaApiKeyForRequest(): string {
  return readStadiaKeyFromEnv();
}

export function isStadiaConfigured(): boolean {
  return Boolean(getStadiaApiKeyForRequest());
}
