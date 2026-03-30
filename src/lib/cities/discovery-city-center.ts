import { PILOT_CITY_DEFINITIONS } from "@/lib/pilot-cities";

/** Fallback map centers when `City.lat` / `City.lng` are unset. */
const slugCenters: Record<string, { latitude: number; longitude: number }> = Object.fromEntries(
  PILOT_CITY_DEFINITIONS.map((c) => [
    c.slug,
    { latitude: c.lat, longitude: c.lng },
  ]),
);

export const GERMANY_DISCOVERY_CENTER = { latitude: 51.1657, longitude: 10.4515 };

export function resolveDiscoveryCityCenter(
  slug: string,
  lat: number | null,
  lng: number | null,
): { latitude: number; longitude: number } {
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return slugCenters[slug] ?? GERMANY_DISCOVERY_CENTER;
}
