import type { FeedDiscoveryBundle } from "./get-feed-discovery";

const HOME_PLACES = 4;
const HOME_EVENTS = 3;
const HOME_COLLECTIONS = 3;

/** Smaller discovery snapshot for the logged-in home (not the full feed block). */
export function sliceDiscoveryForHome(bundle: FeedDiscoveryBundle): FeedDiscoveryBundle {
  return {
    ...bundle,
    places: bundle.places.slice(0, HOME_PLACES),
    events: bundle.events.slice(0, HOME_EVENTS),
    collections: bundle.collections.slice(0, HOME_COLLECTIONS),
  };
}
