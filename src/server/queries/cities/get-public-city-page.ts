import { unstable_cache } from "next/cache";

import { GERMANY_DISCOVERY_CENTER, resolveDiscoveryCityCenter } from "@/lib/cities/discovery-city-center";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import { prisma } from "@/lib/prisma";
import { getGermanyMapClusters } from "@/server/queries/cities/get-germany-map-clusters";
import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { compareByAiRanking } from "@/server/queries/ai-shared";
import { resolveEventImage } from "@/lib/events";
import { resolvePlaceImage } from "@/lib/places";
import {
  buildPublicEventWhere,
  publicEventRecordForFlight,
  publicEventSelectWithAi,
  publicEventSelectWithAiMapPin,
  type PublicEventRecordWithAi,
  type PublicEventRecordWithAiMapPin,
} from "@/server/queries/events/shared";
import {
  buildPublicPlaceWhere,
  normalizePlaceRatingSourcesForClient,
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
  publicPlaceSelectWithAiDiscoveryMap,
  publicPlaceSelectWithAiMapPin,
  type PublicPlaceRecordWithAi,
  type PublicPlaceRecordWithAiDiscoveryMap,
  type PublicPlaceRecordWithAiMapPin,
} from "@/server/queries/places/shared";

export type PublicDiscoveryMapPlaceRecord = {
  id: string;
  slug: string;
  name: string;
  descriptionDe: string | null;
  descriptionTr: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  displayRatingValue: number | null;
  displayRatingCount: number | null;
  ratingSourceCount: number | null;
  category: {
    slug: string;
    nameDe: string;
    nameTr: string;
  };
  city: {
    slug: string;
    nameDe: string;
    nameTr: string;
  };
  /** Server-aufgelöstes Cover (Liste/Detail-Logik), für Map-Popup-Thumbnails. */
  coverImageUrl: string | null;
};

export type PublicDiscoveryMapEventRecord = {
  id: string;
  slug: string;
  title: string;
  descriptionDe: string | null;
  descriptionTr: string | null;
  latitude: number | null;
  longitude: number | null;
  category: PublicEventRecordWithAi["category"];
  startsAt: Date;
  endsAt: Date | null;
  coverImageUrl: string | null;
};

const GERMANY_MAP_VIRTUAL_CITY = {
  id: "virtual-de-discovery-map",
  slug: "deutschland",
  nameDe: "Deutschland",
  nameTr: "Almanya",
  isPilot: false,
} as const;

/** Per-city discovery map: genug für große Städte; Deutschland-Übersicht nutzt nur Cluster. */
const CITY_MAP_PLACE_FETCH_LIMIT = 1600;
const CITY_MAP_PLACE_MARKER_LIMIT = 1600;
const CITY_MAP_EVENT_FETCH_LIMIT = 120;
const CITY_MAP_EVENT_MARKER_LIMIT = 60;

/** Sample size for national homepage featured cards (not map pins). */
const GERMANY_FEATURED_SAMPLE = 96;

async function loadFeaturedPlacesFull(
  rankedLiteTop: PublicPlaceRecordWithAiDiscoveryMap[],
): Promise<PublicPlaceRecordWithAi[]> {
  const ids = rankedLiteTop.map((p) => p.id);
  if (ids.length === 0) {
    return [];
  }
  const rows = await prisma.place.findMany({
    where: { id: { in: ids } },
    select: publicPlaceSelectWithAi,
  });
  const byId = new Map(rows.map((p) => [p.id, p]));
  return rankedLiteTop.map((p) => byId.get(p.id) ?? (p as unknown as PublicPlaceRecordWithAi));
}

function mapPlaceRecordForDiscoveryMap(
  place: PublicPlaceRecordWithAiMapPin | PublicPlaceRecordWithAiDiscoveryMap,
): PublicDiscoveryMapPlaceRecord {
  const sourcesRaw =
    "placeRatingSources" in place ? place.placeRatingSources : undefined;
  const cover = resolvePlaceImage({
    images: "images" in place ? place.images : null,
    primaryImageAsset:
      "primaryImageAsset" in place ? place.primaryImageAsset : null,
    fallbackImageAsset:
      "fallbackImageAsset" in place ? place.fallbackImageAsset : null,
    mediaAssets: "mediaAssets" in place ? place.mediaAssets : null,
    placeRatingSources: normalizePlaceRatingSourcesForClient(sourcesRaw),
  });
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    descriptionDe: place.descriptionDe,
    descriptionTr: place.descriptionTr,
    addressLine1: place.addressLine1,
    postalCode: place.postalCode,
    latitude: place.latitude,
    longitude: place.longitude,
    displayRatingValue:
      place.displayRatingValue != null ? Number(place.displayRatingValue) : null,
    displayRatingCount: place.displayRatingCount,
    ratingSourceCount: place.ratingSourceCount,
    category: {
      slug: place.category.slug,
      nameDe: place.category.nameDe,
      nameTr: place.category.nameTr,
    },
    city: {
      slug: place.city.slug,
      nameDe: place.city.nameDe,
      nameTr: place.city.nameTr,
    },
    coverImageUrl: cover?.url ?? null,
  };
}

function mapEventRecordForDiscoveryMap(
  event: PublicEventRecordWithAi | PublicEventRecordWithAiMapPin,
): PublicDiscoveryMapEventRecord {
  const cover = resolveEventImage({
    primaryImageAsset:
      "primaryImageAsset" in event ? event.primaryImageAsset : null,
    fallbackImageAsset:
      "fallbackImageAsset" in event ? event.fallbackImageAsset : null,
    imageUrl: "imageUrl" in event ? event.imageUrl : null,
  });
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    descriptionDe: event.descriptionDe,
    descriptionTr: event.descriptionTr,
    latitude: event.latitude,
    longitude: event.longitude,
    category: event.category,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    coverImageUrl: cover?.url ?? null,
  };
}

function rankCityEvents(events: PublicEventRecordWithAi[]) {
  return [...events].sort((left, right) =>
    compareByAiRanking<PublicEventRecordWithAi>(left, right, (eventLeft, eventRight) => {
      const startsAtDiff = eventLeft.startsAt.getTime() - eventRight.startsAt.getTime();

      if (startsAtDiff !== 0) {
        return startsAtDiff;
      }

      return eventRight.createdAt.getTime() - eventLeft.createdAt.getTime();
    }),
  );
}

function rankCityEventsForMapPins(events: PublicEventRecordWithAiMapPin[]) {
  return [...events].sort((left, right) =>
    compareByAiRanking<PublicEventRecordWithAiMapPin>(left, right, (eventLeft, eventRight) => {
      const startsAtDiff = eventLeft.startsAt.getTime() - eventRight.startsAt.getTime();

      if (startsAtDiff !== 0) {
        return startsAtDiff;
      }

      return eventRight.createdAt.getTime() - eventLeft.createdAt.getTime();
    }),
  );
}

function rankCityPlaces(
  places: readonly PublicPlaceRecordWithAi[] | readonly PublicPlaceRecordWithAiDiscoveryMap[],
) {
  return [...places].sort((left, right) =>
    compareByAiRanking<PublicPlaceRecordWithAi>(left as PublicPlaceRecordWithAi, right as PublicPlaceRecordWithAi, (placeLeft, placeRight) => {
      const scoreDiff =
        computeCategoryAdjustedScore(placeRight) - computeCategoryAdjustedScore(placeLeft);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingCountDiff =
        getPlaceScoreRatingCount(placeRight) - getPlaceScoreRatingCount(placeLeft);
      if (ratingCountDiff !== 0) {
        return ratingCountDiff;
      }

      const verificationStatusDiff = (placeLeft.verificationStatus ?? "").localeCompare(
        placeRight.verificationStatus ?? "",
      );

      if (verificationStatusDiff !== 0) {
        return -verificationStatusDiff;
      }

      return placeRight.createdAt.getTime() - placeLeft.createdAt.getTime();
    }),
  );
}

function rankCityPlacesForMapPins(places: readonly PublicPlaceRecordWithAiMapPin[]) {
  return [...places].sort((left, right) =>
    compareByAiRanking<PublicPlaceRecordWithAiMapPin>(left, right, (placeLeft, placeRight) => {
      const scoreDiff =
        computeCategoryAdjustedScore(placeRight) - computeCategoryAdjustedScore(placeLeft);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingCountDiff =
        getPlaceScoreRatingCount(placeRight) - getPlaceScoreRatingCount(placeLeft);
      if (ratingCountDiff !== 0) {
        return ratingCountDiff;
      }

      const verificationStatusDiff = (placeLeft.verificationStatus ?? "").localeCompare(
        placeRight.verificationStatus ?? "",
      );

      if (verificationStatusDiff !== 0) {
        return -verificationStatusDiff;
      }

      return placeRight.createdAt.getTime() - placeLeft.createdAt.getTime();
    }),
  );
}

async function getPublicCityPagePublicUncached(citySlug: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      isPilot: true,
      lat: true,
      lng: true,
    },
  });

  if (!city) {
    return null;
  }

  const cityCenter = resolveDiscoveryCityCenter(city.slug, city.lat, city.lng);

  const [mapPlacesLite, mapEvents, placeCount, eventCount] = await prisma.$transaction([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: CITY_MAP_PLACE_FETCH_LIMIT,
      select: publicPlaceSelectWithAiDiscoveryMap,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: {
          gte: new Date(),
        },
      }),
      orderBy: { startsAt: "asc" },
      take: CITY_MAP_EVENT_FETCH_LIMIT,
      select: publicEventSelectWithAi,
    }),
    prisma.place.count({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
    }),
    prisma.event.count({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: { gte: new Date() },
      }),
    }),
  ]);

  const rankedPlacesAll = rankCityPlaces(mapPlacesLite);
  const rankedEventsAll = rankCityEvents(mapEvents);
  const featuredLiteTop = rankedPlacesAll.slice(0, 3) as PublicPlaceRecordWithAiDiscoveryMap[];
  const upcomingEvents = rankedEventsAll.slice(0, 3);

  const featuredPlacesFull = await loadFeaturedPlacesFull(featuredLiteTop);

  return {
    city,
    cityCenter,
    placeCount,
    eventCount,
    featuredPlacesFull,
    upcomingEvents,
  };
}

async function getPublicCityPagePublicData(citySlug: string) {
  const base = await getPublicCityPagePublicUncached(citySlug);
  if (!base) {
    return null;
  }

  return {
    city: base.city,
    cityCenter: base.cityCenter,
    placeCount: base.placeCount,
    eventCount: base.eventCount,
    featuredPlaces: base.featuredPlacesFull.map((place) => publicPlaceRecordForFlight(place, false)),
    mapPlaces: [],
    upcomingEvents: base.upcomingEvents.map((event) => publicEventRecordForFlight(event, false)),
    mapEvents: [],
  };
}

async function getPublicCityPagePrivate(citySlug: string, userId: string) {
  const base = await getPublicCityPagePublicUncached(citySlug);
  if (!base) {
    return null;
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: base.featuredPlacesFull.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: base.upcomingEvents.map((event) => event.id) },
      },
      select: { eventId: true },
    }),
  ]);

  const savedPlaceIds = new Set(savedPlaces.map((entry) => entry.placeId));
  const savedEventIds = new Set(savedEvents.map((entry) => entry.eventId));

  return {
    city: base.city,
    cityCenter: base.cityCenter,
    placeCount: base.placeCount,
    eventCount: base.eventCount,
    featuredPlaces: base.featuredPlacesFull.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    upcomingEvents: base.upcomingEvents.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
    mapPlaces: [],
    mapEvents: [],
  };
}

const getPublicCityPagePublicCached = unstable_cache(
  async (citySlug: string) => getPublicCityPagePublicData(citySlug),
  ["discovery:city-page-public"],
  { revalidate: 300 },
);

export async function getPublicCityPage(citySlug: string, userId?: string) {
  if (!userId) {
    return getPublicCityPagePublicCached(citySlug);
  }

  return getPublicCityPagePrivate(citySlug, userId);
}

async function getDiscoveryMapPinsForCitySlugUncached(citySlug: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: { id: true },
  });

  if (!city) {
    return null;
  }

  const [mapPlaces, mapEvents] = await prisma.$transaction([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: CITY_MAP_PLACE_FETCH_LIMIT,
      select: publicPlaceSelectWithAiMapPin,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: {
          gte: new Date(),
        },
      }),
      orderBy: { startsAt: "asc" },
      take: CITY_MAP_EVENT_FETCH_LIMIT,
      select: publicEventSelectWithAiMapPin,
    }),
  ]);

  const rankedPlaces = rankCityPlacesForMapPins(mapPlaces).slice(0, CITY_MAP_PLACE_MARKER_LIMIT);
  const rankedEvents = rankCityEventsForMapPins(mapEvents).slice(0, CITY_MAP_EVENT_MARKER_LIMIT);

  return {
    places: rankedPlaces.map(mapPlaceRecordForDiscoveryMap),
    events: rankedEvents.map(mapEventRecordForDiscoveryMap),
  };
}

const getDiscoveryMapPinsForCitySlugCached = unstable_cache(
  async (citySlug: string) => getDiscoveryMapPinsForCitySlugUncached(citySlug),
  /** Version bump when pin payload shape changes (e.g. `coverImageUrl`). */
  ["discovery:city-map-pins", "v2-cover-image"],
  { revalidate: 300 },
);

export async function getDiscoveryMapPinsForCitySlug(citySlug: string, _userId?: string) {
  return getDiscoveryMapPinsForCitySlugCached(citySlug);
}

async function getPublicGermanyDiscoveryPagePublicUncached() {
  const wherePlace = buildPublicPlaceWhere({
    city: { countryCode: "DE" },
  });
  const whereEvent = buildPublicEventWhere({
    city: { countryCode: "DE" },
    startsAt: {
      gte: new Date(),
    },
  });

  const [placeCount, eventCount, germanyMapClustersResult] = await Promise.all([
    prisma.place.count({ where: wherePlace }),
    prisma.event.count({
      where: buildPublicEventWhere({
        city: { countryCode: "DE" },
        startsAt: { gte: new Date() },
      }),
    }),
    getGermanyMapClusters().catch((): GermanyMapCluster[] => []),
  ]);

  const germanyMapClusters = germanyMapClustersResult;

  const city = { ...GERMANY_MAP_VIRTUAL_CITY };

  return {
    city,
    cityCenter: GERMANY_DISCOVERY_CENTER,
    placeCount,
    eventCount,
    germanyMapClusters,
    featuredPlaces: [],
    mapPlaces: [],
    upcomingEvents: [],
    mapEvents: [],
  };
}

const getPublicGermanyDiscoveryPagePublicCached = unstable_cache(
  getPublicGermanyDiscoveryPagePublicUncached,
  ["discovery:germany-page-public"],
  { revalidate: 300 },
);

export async function getPublicGermanyDiscoveryPage(userId?: string) {
  if (!userId) {
    return getPublicGermanyDiscoveryPagePublicCached();
  }

  return getPublicGermanyDiscoveryPagePublicUncached();
}
