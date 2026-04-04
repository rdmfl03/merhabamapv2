/**
 * Google Places API (New): Foto-Ressourcenname in API-Antworten, z. B. `places/ChIJ…/photos/Aw…`.
 * Öffentliche Bilder in der App: nur über `/api/google-photo?placeId=` (siehe Route).
 */

const GOOGLE_PLACES_PHOTO_RESOURCE_RE = /^places\/[^/]+\/photos\/[^/]+$/;

export function isGooglePlacesPhotoResourceName(value: string | null | undefined): boolean {
  const t = value?.trim() ?? "";
  return t.length > 0 && GOOGLE_PLACES_PHOTO_RESOURCE_RE.test(t);
}

function isBareGooglePlaceId(value: string): boolean {
  const t = value.trim();
  if (t.length < 4 || t.length > 512) {
    return false;
  }
  if (t.includes("..") || t.includes("\\") || t.includes("/")) {
    return false;
  }
  return true;
}

function normalizeBareGooglePlaceId(raw: string): string | null {
  const t = raw.trim();
  const bare = t.startsWith("places/") ? t.slice("places/".length).trim() : t;
  if (!bare || !isBareGooglePlaceId(bare)) {
    return null;
  }
  return bare;
}

type RatingSourceRowForPhoto = {
  provider: string;
  status: string;
  ratingCount: number;
  externalRef?: string | null;
};

/**
 * Wenn es keine `media_assets` gibt, kann die App das erste Google-Foto über
 * `GET /api/google-photo?placeId=` laden (serverseitig autorisiert via `place_rating_sources`).
 */
export function getGooglePlaceIdFromRatingSourcesForPhoto(
  placeRatingSources: RatingSourceRowForPhoto[] | null | undefined,
): string | null {
  const row = placeRatingSources?.find(
    (s) => s.provider === "GOOGLE" && s.status === "ACTIVE",
  );
  const raw = row?.externalRef;
  if (raw == null) {
    return null;
  }
  return normalizeBareGooglePlaceId(raw);
}

const DEFAULT_FIRST_PHOTO_MAX_HEIGHT_PX = 720;

export function buildGooglePlaceFirstPhotoProxyUrl(
  placeId: string,
  maxHeightPx: number = DEFAULT_FIRST_PHOTO_MAX_HEIGHT_PX,
): string {
  const q = new URLSearchParams();
  q.set("placeId", placeId);
  q.set("maxHeightPx", String(maxHeightPx));
  return `/api/google-photo?${q.toString()}`;
}
