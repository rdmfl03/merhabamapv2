/** Query keys for opening the city discovery map with a pin selected and popup open. */
export const DISCOVERY_MAP_FOCUS_PLACE_PARAM = "mapPlace";
export const DISCOVERY_MAP_FOCUS_EVENT_PARAM = "mapEvent";

export function buildDiscoveryMapPathForPlace(citySlug: string, placeId: string): string {
  const params = new URLSearchParams();
  params.set("city", citySlug);
  params.set(DISCOVERY_MAP_FOCUS_PLACE_PARAM, placeId);
  return `/map?${params.toString()}`;
}

export function buildDiscoveryMapPathForEvent(citySlug: string, eventId: string): string {
  const params = new URLSearchParams();
  params.set("city", citySlug);
  params.set(DISCOVERY_MAP_FOCUS_EVENT_PARAM, eventId);
  return `/map?${params.toString()}`;
}
