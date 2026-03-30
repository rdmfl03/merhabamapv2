export type DiscoveryPlaceReason = "saved" | "comments" | "listed" | "mixed";

export type DiscoveryEventReason = "participation" | "comments" | "saved" | "mixed";

export type DiscoveryCollectionReason = "recentAdds" | "newList";

export type TrendingPlaceDiscoveryRow = {
  id: string;
  slug: string;
  name: string;
  cityLabel: string;
  reason: DiscoveryPlaceReason;
};

export type TrendingEventDiscoveryRow = {
  id: string;
  slug: string;
  title: string;
  cityLabel: string;
  reason: DiscoveryEventReason;
  startsAt: Date;
};

export type TrendingCollectionDiscoveryRow = {
  id: string;
  title: string;
  reason: DiscoveryCollectionReason;
  recentAddCount: number;
};
