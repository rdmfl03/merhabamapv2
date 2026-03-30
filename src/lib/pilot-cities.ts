/**
 * Canonical pilot city slugs and metadata (browse, ingest allowlist, submissions).
 * Keep DB rows in sync via `npm run db:ensure-cities` after changing this list.
 */
export const PILOT_CITY_SLUGS = [
  "berlin",
  "koeln",
  "essen",
  "duisburg",
  "dortmund",
  "duesseldorf",
] as const;

export type PilotCitySlug = (typeof PILOT_CITY_SLUGS)[number];

export const PILOT_CITY_DEFINITIONS = [
  { slug: "berlin", nameDe: "Berlin", nameTr: "Berlin", lat: 52.52, lng: 13.405 },
  { slug: "koeln", nameDe: "Köln", nameTr: "Koln", lat: 50.9375, lng: 6.9603 },
  { slug: "essen", nameDe: "Essen", nameTr: "Essen", lat: 51.4556, lng: 7.0116 },
  { slug: "duisburg", nameDe: "Duisburg", nameTr: "Duisburg", lat: 51.4344, lng: 6.7623 },
  { slug: "dortmund", nameDe: "Dortmund", nameTr: "Dortmund", lat: 51.5136, lng: 7.4653 },
  { slug: "duesseldorf", nameDe: "Düsseldorf", nameTr: "Düsseldorf", lat: 51.2277, lng: 6.7735 },
] as const satisfies ReadonlyArray<{
  readonly slug: PilotCitySlug;
  readonly nameDe: string;
  readonly nameTr: string;
  readonly lat: number;
  readonly lng: number;
}>;

export function isPilotCitySlug(value: string): value is PilotCitySlug {
  return (PILOT_CITY_SLUGS as readonly string[]).includes(value);
}
