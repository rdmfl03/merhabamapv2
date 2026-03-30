import { getFollowedCityIdsForUser } from "@/server/queries/cities/list-followed-cities-for-user";

import type { FeedMode } from "@/server/queries/social/get-feed-activities";

import { listTrendingCollectionsForDiscovery } from "./list-trending-collections";
import { listTrendingEventsForDiscovery } from "./list-trending-events";
import { listTrendingPlacesForDiscovery } from "./list-trending-places";
import type {
  TrendingCollectionDiscoveryRow,
  TrendingEventDiscoveryRow,
  TrendingPlaceDiscoveryRow,
} from "./types";

export type FeedDiscoveryBundle = {
  places: TrendingPlaceDiscoveryRow[];
  events: TrendingEventDiscoveryRow[];
  collections: TrendingCollectionDiscoveryRow[];
  /** City-scoped discovery (Meine Städte); false = global snapshot. */
  isLocalScope: boolean;
  /** Place trending scoped to one category (category browse); use with empty events/collections. */
  isCategoryScope?: boolean;
};

/**
 * Discovery blocks for the feed: global for "Für dich", or filtered to followed cities in local mode.
 * Local mode without followed cities returns empty lists (feed keeps its empty state).
 */
export async function getFeedDiscoveryBundle(args: {
  locale: "de" | "tr";
  mode: FeedMode;
  viewerUserId: string | null;
}): Promise<FeedDiscoveryBundle> {
  const { locale, mode, viewerUserId } = args;

  if (mode === "local") {
    if (!viewerUserId) {
      return { places: [], events: [], collections: [], isLocalScope: true };
    }
    const cityIds = await getFollowedCityIdsForUser(viewerUserId);
    if (cityIds.length === 0) {
      return { places: [], events: [], collections: [], isLocalScope: true };
    }
    const [places, events, collections] = await Promise.all([
      listTrendingPlacesForDiscovery({ locale, cityIds }),
      listTrendingEventsForDiscovery({ locale, cityIds }),
      listTrendingCollectionsForDiscovery({ cityIds }),
    ]);
    return {
      places,
      events,
      collections,
      isLocalScope: true,
    };
  }

  const [places, events, collections] = await Promise.all([
    listTrendingPlacesForDiscovery({ locale }),
    listTrendingEventsForDiscovery({ locale }),
    listTrendingCollectionsForDiscovery({}),
  ]);

  return { places, events, collections, isLocalScope: false };
}
