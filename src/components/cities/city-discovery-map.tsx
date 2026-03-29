"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Crosshair, LocateFixed, MapPin, Search, Star } from "lucide-react";

import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import { Link } from "@/i18n/navigation";
import { formatEventDateRange, getEventCategoryLabelKey } from "@/lib/events";
import {
  computeMapScore,
  getLocalizedPlaceCategoryLabel,
  getPlaceDisplayRatingSummary,
  getLocalizedText,
} from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import type { DiscoveryMapCityOption } from "@/server/queries/cities/get-discovery-map-cities";

const VIEWPORT_BOUNDS_EPS = 1e-6;

function viewportBoundsAlmostEqual(
  previous: MapViewportBounds | null,
  next: MapViewportBounds,
): boolean {
  if (!previous) {
    return false;
  }
  return (
    Math.abs(previous.south - next.south) < VIEWPORT_BOUNDS_EPS &&
    Math.abs(previous.north - next.north) < VIEWPORT_BOUNDS_EPS &&
    Math.abs(previous.west - next.west) < VIEWPORT_BOUNDS_EPS &&
    Math.abs(previous.east - next.east) < VIEWPORT_BOUNDS_EPS
  );
}

type CityPlacePoint = {
  id: string;
  slug: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
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
  descriptionDe: string | null;
  descriptionTr: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  displayRatingValue?: number | string | { toString(): string } | null;
  displayRatingCount?: number | null;
  ratingSourceCount?: number | null;
  verificationStatus: string;
};

/** Eine Zeile für Karte/Liste: Straße + PLZ Ort, ohne doppelte PLZ wenn schon in der Straßenzeile. */
function formatMapPlaceAddressLine(
  locale: "de" | "tr",
  place: CityPlacePoint,
): string | null {
  const street = place.addressLine1?.trim() ?? "";
  const pc = place.postalCode?.trim() ?? "";
  const city = getLocalizedCityDisplayName(locale, place.city);
  const cityPart = [pc, city].filter(Boolean).join(" ");

  if (!street && !cityPart) {
    return null;
  }

  if (!street) {
    return cityPart;
  }

  const lower = street.toLowerCase();
  const pcInStreet = pc.length > 0 && lower.includes(pc.toLowerCase());
  const cityInStreet = city.length > 0 && lower.includes(city.toLowerCase());

  if (pcInStreet && cityInStreet) {
    return street;
  }
  if (pcInStreet && !cityInStreet && city) {
    return `${street}, ${city}`;
  }
  if (cityPart) {
    return `${street}, ${cityPart}`;
  }
  return street;
}

type CityEventPoint = {
  id: string;
  slug: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  city: {
    slug: string;
    nameDe: string;
    nameTr: string;
  };
  descriptionDe: string | null;
  descriptionTr: string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
};

const EMPTY_EFFECTIVE_PLACES: CityPlacePoint[] = [];
const EMPTY_EFFECTIVE_EVENTS: CityEventPoint[] = [];

type CityDiscoveryMapProps = {
  locale: "de" | "tr";
  cityName: string;
  cityCenter: {
    latitude: number;
    longitude: number;
  } | null;
  title: string;
  description: string;
  placeCount: number;
  eventCount: number;
  mapCityOptions: DiscoveryMapCityOption[];
  selectedCitySlug: string;
  cityPickerLabel: string;
  cityPickerAllLabel: string;
  legendPlaces: string;
  legendEvents: string;
  empty: string;
  noResults: string;
  noResultsInViewport: string;
  awaitingMapViewport: string;
  searchPlaceholder: string;
  allLabel: string;
  placesOnlyLabel: string;
  eventsOnlyLabel: string;
  allCategoriesLabel: string;
  resetFiltersLabel: string;
  resultsTitle: string;
  /** z. B. „Bewertungen“ / „değerlendirme“ für die Trefferliste. */
  listRatingReviewsSuffix: string;
  resultsSummaryUnitLabel: string;
  viewPlaceLabel: string;
  placePopupRatingCaption: string;
  viewEventLabel: string;
  locateMeLabel: string;
  locatingLabel: string;
  locationUnavailableLabel: string;
  myLocationLabel: string;
  categoryLabels: Record<string, string>;
  places: CityPlacePoint[];
  events: CityEventPoint[];
  /** When set (national map), map shows city clusters until one is opened. */
  germanyMapClusters?: GermanyMapCluster[] | null;
  germanyClusterHint?: string;
  germanyBackToOverview?: string;
  germanyClusterRevealLabel?: string;
  germanyLoadingCity?: string;
  resultsCitiesUnit?: string;
};

type NormalizedPoint =
  | {
      id: string;
      kind: "place";
      label: string;
      href: string;
      description: string;
      latitude: number;
      longitude: number;
      categoryKey: string;
      categoryLabel: string;
      meta: string;
      mapAddressLine: string | null;
      mapRatingValue: number | null;
      mapRatingLabel: string | null;
      mapRatingReviewCount: number | null;
      tone: "brand";
    }
  | {
      id: string;
      kind: "event";
      label: string;
      href: string;
      description: string;
      latitude: number;
      longitude: number;
      categoryKey: string;
      categoryLabel: string;
      meta: string;
      tone: "dark";
    };

function pointInBounds(lat: number, lng: number, bounds: MapViewportBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

type DiscoveryMapPointCardProps = {
  point: NormalizedPoint;
  locale: "de" | "tr";
  listRatingReviewsSuffix: string;
  activePointId: string | null;
  viewPlaceLabel: string;
  viewEventLabel: string;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
  onLeavePoint: (id: string) => void;
};

function DiscoveryMapPointCard({
  point,
  locale,
  listRatingReviewsSuffix,
  activePointId,
  viewPlaceLabel,
  viewEventLabel,
  setHoveredId,
  onLeavePoint,
}: DiscoveryMapPointCardProps) {
  const isActive = activePointId === point.id;
  const countLocale = locale === "tr" ? "tr-TR" : "de-DE";
  return (
    <Link
      href={point.href as Route}
      className={`block rounded-[1.5rem] border p-4 transition ${
        isActive
          ? "border-brand/40 bg-brand-soft/60 shadow-sm"
          : "border-border/70 bg-white/92 hover:border-brand/30 hover:bg-white"
      }`}
      onMouseEnter={() => setHoveredId(point.id)}
      onFocus={() => setHoveredId(point.id)}
      onMouseLeave={() => onLeavePoint(point.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {point.kind === "place" ? (
              <MapPin className="h-4 w-4 text-brand" />
            ) : (
              <CalendarDays className="h-4 w-4 text-foreground" />
            )}
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {point.categoryLabel}
            </span>
          </div>
          <h4 className="font-semibold text-foreground">{point.label}</h4>
          {point.kind === "place" && point.mapRatingLabel ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 shrink-0 fill-current text-amber-500" aria-hidden />
              <span className="font-medium text-foreground/90">{point.mapRatingLabel}</span>
              {point.mapRatingReviewCount != null ? (
                <span>
                  (
                  {new Intl.NumberFormat(countLocale).format(point.mapRatingReviewCount)}{" "}
                  {listRatingReviewsSuffix})
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="text-sm leading-6 text-muted-foreground" suppressHydrationWarning>
            {point.description ||
              (point.kind === "place" ? point.mapAddressLine : null) ||
              point.meta}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-foreground">
          {point.kind === "place" ? viewPlaceLabel : viewEventLabel}
        </span>
      </div>
    </Link>
  );
}

type DiscoveryMapListPanelsProps = {
  locale: "de" | "tr";
  listRatingReviewsSuffix: string;
  viewportBounds: MapViewportBounds | null;
  normalized: NormalizedPoint[];
  filtered: NormalizedPoint[];
  listCount: number;
  hasActiveFilters: boolean;
  listHintWhenNoPins: string | null;
  awaitingMapViewport: string;
  empty: string;
  noResults: string;
  noResultsInViewport: string;
  legendPlaces: string;
  legendEvents: string;
  filteredPlaces: NormalizedPoint[];
  filteredEvents: NormalizedPoint[];
  totalFilteredPlaces: number;
  totalFilteredEvents: number;
  activePointId: string | null;
  viewPlaceLabel: string;
  viewEventLabel: string;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
  onLeavePoint: (id: string) => void;
};

function DiscoveryMapListPanels({
  locale,
  listRatingReviewsSuffix,
  viewportBounds,
  normalized,
  filtered,
  listCount,
  hasActiveFilters,
  listHintWhenNoPins,
  awaitingMapViewport,
  empty,
  noResults,
  noResultsInViewport,
  legendPlaces,
  legendEvents,
  filteredPlaces,
  filteredEvents,
  totalFilteredPlaces,
  totalFilteredEvents,
  activePointId,
  viewPlaceLabel,
  viewEventLabel,
  setHoveredId,
  onLeavePoint,
}: DiscoveryMapListPanelsProps) {
  if (!viewportBounds) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
        {listHintWhenNoPins ?? awaitingMapViewport}
      </div>
    );
  }

  if (normalized.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
        {listHintWhenNoPins ?? empty}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
        {hasActiveFilters ? noResults : empty}
      </div>
    );
  }

  if (listCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
        {noResultsInViewport}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/92 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            <span className="font-semibold text-foreground">{legendPlaces}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredPlaces.length} von {totalFilteredPlaces}
          </span>
        </div>
        {filteredPlaces.length > 0 ? (
          filteredPlaces.map((point) => (
            <DiscoveryMapPointCard
              key={point.id}
              point={point}
              locale={locale}
              listRatingReviewsSuffix={listRatingReviewsSuffix}
              activePointId={activePointId}
              viewPlaceLabel={viewPlaceLabel}
              viewEventLabel={viewEventLabel}
              setHoveredId={setHoveredId}
              onLeavePoint={onLeavePoint}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white/75 px-4 py-5 text-sm text-muted-foreground">
            {legendPlaces}: 0
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/92 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-foreground" />
            <span className="font-semibold text-foreground">{legendEvents}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredEvents.length} von {totalFilteredEvents}
          </span>
        </div>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((point) => (
            <DiscoveryMapPointCard
              key={point.id}
              point={point}
              locale={locale}
              listRatingReviewsSuffix={listRatingReviewsSuffix}
              activePointId={activePointId}
              viewPlaceLabel={viewPlaceLabel}
              viewEventLabel={viewEventLabel}
              setHoveredId={setHoveredId}
              onLeavePoint={onLeavePoint}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white/75 px-4 py-5 text-sm text-muted-foreground">
            {legendEvents}: 0
          </div>
        )}
      </div>
    </>
  );
}

const CityDiscoveryInteractiveMap = dynamic(
  () =>
    import("./city-discovery-leaflet-map").then((module) => module.CityDiscoveryLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[36rem] animate-pulse rounded-[1.9rem] border border-border/70 bg-muted/60 lg:h-[42rem]" />
    ),
  },
);

export function CityDiscoveryMap({
  locale,
  cityName,
  cityCenter,
  title,
  description,
  placeCount,
  eventCount,
  mapCityOptions,
  selectedCitySlug,
  cityPickerLabel,
  cityPickerAllLabel,
  legendPlaces,
  legendEvents,
  empty,
  noResults,
  noResultsInViewport,
  awaitingMapViewport,
  searchPlaceholder,
  allLabel,
  placesOnlyLabel,
  eventsOnlyLabel,
  allCategoriesLabel,
  resetFiltersLabel,
  resultsTitle,
  listRatingReviewsSuffix,
  resultsSummaryUnitLabel,
  viewPlaceLabel,
  placePopupRatingCaption,
  viewEventLabel,
  locateMeLabel,
  locatingLabel,
  locationUnavailableLabel,
  myLocationLabel,
  categoryLabels,
  places,
  events,
  germanyMapClusters,
  germanyClusterHint = "",
  germanyBackToOverview = "",
  germanyClusterRevealLabel = "",
  germanyLoadingCity = "",
  resultsCitiesUnit = "",
}: CityDiscoveryMapProps) {
  const router = useRouter();
  const [cityPickerValue, setCityPickerValue] = useState(selectedCitySlug);
  const [typeFilter, setTypeFilter] = useState<"all" | "place" | "event">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationState, setLocationState] = useState<
    "idle" | "loading" | "unavailable"
  >("idle");
  const [viewportBounds, setViewportBounds] = useState<MapViewportBounds | null>(null);
  const [clusterLoadingSlug, setClusterLoadingSlug] = useState<string | null>(null);

  const isGermanyClusterMode =
    germanyMapClusters != null && selectedCitySlug === "";
  /** Deutschland-Übersicht: nur Cluster, keine Einzelpins (Server liefert hier leere map-Arrays). */
  const effectivePlaces = useMemo(
    () => (isGermanyClusterMode ? EMPTY_EFFECTIVE_PLACES : places),
    [isGermanyClusterMode, places],
  );
  const effectiveEvents = useMemo(
    () => (isGermanyClusterMode ? EMPTY_EFFECTIVE_EVENTS : events),
    [isGermanyClusterMode, events],
  );

  const handleViewportBounds = useCallback((bounds: MapViewportBounds) => {
    setViewportBounds((prev) =>
      viewportBoundsAlmostEqual(prev, bounds) ? prev : bounds,
    );
  }, []);

  useEffect(() => {
    setCityPickerValue(selectedCitySlug);
  }, [selectedCitySlug]);

  useEffect(() => {
    setViewportBounds(null);
    setSelectedId(null);
    setHoveredId(null);
  }, [selectedCitySlug]);

  useEffect(() => {
    if (selectedCitySlug) {
      setClusterLoadingSlug(null);
    }
  }, [selectedCitySlug]);

  const germanyClusterMarkers = useMemo(() => {
    if (!isGermanyClusterMode || !germanyMapClusters?.length) {
      return undefined;
    }
    return germanyMapClusters.map((cluster) => ({
      slug: cluster.slug,
      label: getLocalizedCityDisplayName(locale, cluster),
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      placeCount: cluster.placeCount,
      eventCount: cluster.eventCount,
    }));
  }, [germanyMapClusters, isGermanyClusterMode, locale]);

  const handleGermanyClusterClick = useCallback(
    async (slug: string) => {
      setClusterLoadingSlug(slug);
      try {
        await router.push(
          `/${locale}/map?city=${encodeURIComponent(slug)}` as Route,
        );
      } finally {
        setClusterLoadingSlug(null);
      }
    },
    [locale, router],
  );

  const normalized = useMemo<NormalizedPoint[]>(() => {
    const normalizedPlaces = effectivePlaces
      .filter(
        (place) =>
          typeof place.latitude === "number" && typeof place.longitude === "number",
      )
      .map((place) => {
        const rating = getPlaceDisplayRatingSummary(
          place as unknown as Parameters<typeof getPlaceDisplayRatingSummary>[0],
        );
        const ratingLocale = locale === "tr" ? "tr-TR" : "de-DE";
        const v = rating?.value;
        const mapRatingLabel =
          v != null && Number.isFinite(v)
            ? `${v.toLocaleString(ratingLocale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })} / 5`
            : null;
        return {
          id: `place-${place.id}`,
          kind: "place" as const,
          label: place.name,
          href: `/places/${place.slug}`,
          description: getLocalizedText(
            { de: place.descriptionDe, tr: place.descriptionTr },
            locale,
            "",
          ),
          latitude: place.latitude as number,
          longitude: place.longitude as number,
          categoryKey: place.category.slug,
          categoryLabel: getLocalizedPlaceCategoryLabel(place.category, locale),
          meta: getLocalizedCityDisplayName(locale, place.city),
          mapAddressLine: formatMapPlaceAddressLine(locale, place),
          mapRatingValue: rating?.value ?? null,
          mapRatingLabel,
          mapRatingReviewCount:
            rating != null && rating.count > 0 ? rating.count : null,
          tone: "brand" as const,
        };
      });

    const normalizedEvents = effectiveEvents
      .filter(
        (event) =>
          typeof event.latitude === "number" && typeof event.longitude === "number",
      )
      .map((event) => ({
        id: `event-${event.id}`,
        kind: "event" as const,
        label: event.title,
        href: `/events/${event.slug}`,
        description: getLocalizedText(
          { de: event.descriptionDe, tr: event.descriptionTr },
          locale,
          "",
        ),
        latitude: event.latitude as number,
        longitude: event.longitude as number,
        categoryKey: getEventCategoryLabelKey(event.category as never),
        categoryLabel:
          categoryLabels[getEventCategoryLabelKey(event.category as never)] ??
          event.category,
        meta: formatEventDateRange(
          locale,
          new Date(event.startsAt),
          event.endsAt != null ? new Date(event.endsAt) : null,
        ),
        tone: "dark" as const,
      }));

    return [...normalizedPlaces, ...normalizedEvents];
  }, [categoryLabels, effectiveEvents, effectivePlaces, locale]);

  const categories = useMemo(() => {
    return [
      { key: "all", label: allCategoriesLabel },
      ...Array.from(
        new Map(
          normalized.map((point) => [point.categoryKey, point.categoryLabel]),
        ).entries(),
      ).map(([key, label]) => ({ key, label })),
    ];
  }, [allCategoriesLabel, normalized]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalized.filter((point) => {
      if (typeFilter !== "all" && point.kind !== typeFilter) {
        return false;
      }

      if (categoryFilter !== "all" && point.categoryKey !== categoryFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      const locationHaystack =
        point.kind === "place" && point.mapAddressLine ? ` ${point.mapAddressLine}` : "";
      const haystack =
        `${point.label} ${point.description} ${point.categoryLabel} ${point.meta}${locationHaystack}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [categoryFilter, normalized, query, typeFilter]);

  const inViewFiltered = useMemo(() => {
    if (!viewportBounds) {
      return [];
    }
    return filtered.filter((point) =>
      pointInBounds(point.latitude, point.longitude, viewportBounds),
    );
  }, [filtered, viewportBounds]);

  const mapPoints = useMemo<CityMapPoint[]>(() => {
    const ratingLocale = locale === "tr" ? "tr-TR" : "de-DE";
    return filtered.map((point) => {
      const base: CityMapPoint = {
        id: point.id,
        kind: point.kind,
        label: point.label,
        href: point.href,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
        categoryLabel: point.categoryLabel,
        meta: point.meta,
      };
      if (point.kind !== "place") {
        return base;
      }
      const v = point.mapRatingValue;
      const mapRatingLabel =
        v != null && Number.isFinite(v)
          ? `${v.toLocaleString(ratingLocale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} / 5`
          : null;
      return {
        ...base,
        mapAddressLine: point.mapAddressLine,
        mapRatingLabel,
      };
    });
  }, [filtered, locale]);

  const hasActiveFilters = Boolean(
    query || categoryFilter !== "all" || typeFilter !== "all",
  );
  const activePointId = selectedId ?? hoveredId;
  const onLeaveHoveredPoint = useCallback((id: string) => {
    setHoveredId((current) => (current === id ? null : current));
  }, []);
  const listSource = viewportBounds ? inViewFiltered : null;

  const filteredPlaces = useMemo(
    () =>
      listSource
        ? [...listSource]
            .filter((point) => point.kind === "place")
            .sort((a, b) => {
              const placeA = effectivePlaces.find((place) => `place-${place.id}` === a.id);
              const placeB = effectivePlaces.find((place) => `place-${place.id}` === b.id);

              const scoreDiff =
                computeMapScore(
                  (placeB ?? {}) as Parameters<typeof computeMapScore>[0],
                  userLocation,
                ) -
                computeMapScore(
                  (placeA ?? {}) as Parameters<typeof computeMapScore>[0],
                  userLocation,
                );
              if (scoreDiff !== 0) {
                return scoreDiff;
              }

              return Number(b.id === selectedId) - Number(a.id === selectedId);
            })
            .slice(0, 10)
        : [],
    [effectivePlaces, listSource, selectedId, userLocation],
  );

  const listHintWhenNoPins =
    isGermanyClusterMode &&
    germanyClusterHint &&
    (germanyMapClusters?.length ?? 0) > 0
      ? germanyClusterHint
      : null;
  const filteredEvents = useMemo(
    () =>
      listSource
        ? [...listSource]
            .filter((point) => point.kind === "event")
            .sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId))
            .slice(0, 10)
        : [],
    [listSource, selectedId],
  );
  const totalFilteredPlaces = useMemo(
    () => (listSource ? listSource.filter((point) => point.kind === "place").length : 0),
    [listSource],
  );
  const totalFilteredEvents = useMemo(
    () => (listSource ? listSource.filter((point) => point.kind === "event").length : 0),
    [listSource],
  );
  const listCount = listSource?.length ?? 0;

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      return;
    }

    setLocationState("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState("idle");
      },
      () => {
        setLocationState("unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      },
    );
  }

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setHoveredId(null);
    setSelectedId(null);
  }

  function handleCityPickerChange(slug: string) {
    setCityPickerValue(slug);
    const path = slug
      ? `/${locale}/map?city=${encodeURIComponent(slug)}`
      : `/${locale}/map`;
    router.push(path as Route);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-[#f5f6f8]">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {cityName}
            </p>
            <h2 className="mt-1 font-display text-2xl text-foreground sm:text-[2rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <div className="rounded-full border border-border bg-white/92 px-3 py-2">
              <span className="font-semibold text-foreground">{placeCount}</span> {legendPlaces}
            </div>
            <div className="rounded-full border border-border bg-white/92 px-3 py-2">
              <span className="font-semibold text-foreground">{eventCount}</span> {legendEvents}
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={cityPickerValue}
            onChange={(event) => handleCityPickerChange(event.target.value)}
            className="h-11 min-w-[10rem] flex-1 basis-[min(100%,14rem)] rounded-2xl border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={cityPickerLabel}
          >
            <option value="">{cityPickerAllLabel}</option>
            {mapCityOptions.map((city) => (
              <option key={city.slug} value={city.slug}>
                {getLocalizedCityDisplayName(locale, city)}
              </option>
            ))}
          </select>
          <div className="relative min-w-0 flex-1 basis-[min(100%,22rem)]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-11"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-11 min-w-[10rem] flex-1 basis-[min(100%,12rem)] rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={allCategoriesLabel}
          >
            {categories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 px-4"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            {resetFiltersLabel}
          </Button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: allLabel },
            { key: "place", label: placesOnlyLabel },
            { key: "event", label: eventsOnlyLabel },
          ].map((option) => (
            <Button
              key={option.key}
              type="button"
              variant={typeFilter === option.key ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setTypeFilter(option.key as "all" | "place" | "event")
              }
            >
              {option.label}
            </Button>
            ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={locationState === "loading"}
          >
            {locationState === "loading" ? (
              <LocateFixed className="mr-2 h-4 w-4 animate-pulse" />
            ) : (
              <Crosshair className="mr-2 h-4 w-4" />
            )}
            {locationState === "loading" ? locatingLabel : locateMeLabel}
          </Button>
        </div>

        {locationState === "unavailable" ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {locationUnavailableLabel}
          </p>
        ) : null}

        {selectedCitySlug && germanyBackToOverview ? (
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/map` as Route)}
            >
              {germanyBackToOverview}
            </Button>
          </div>
        ) : null}

        <CityDiscoveryInteractiveMap
          points={mapPoints}
          cityCenter={cityCenter}
          selectedId={selectedId}
          onHoverChange={setHoveredId}
          onSelectChange={setSelectedId}
          userLocation={userLocation}
          emptyLabel={empty}
          noResultsLabel={noResults}
          filtered={Boolean(query || categoryFilter !== "all" || typeFilter !== "all")}
          legendPlaces={legendPlaces}
          legendEvents={legendEvents}
          resultsSummaryUnitLabel={resultsSummaryUnitLabel}
          viewPlaceLabel={viewPlaceLabel}
          placePopupRatingCaption={placePopupRatingCaption}
          viewEventLabel={viewEventLabel}
          myLocationLabel={myLocationLabel}
          onViewportBoundsChange={handleViewportBounds}
          germanyCityClusters={germanyClusterMarkers}
          onGermanyCityClusterClick={
            isGermanyClusterMode ? handleGermanyClusterClick : undefined
          }
          mapLayoutEpoch={0}
          clusterLoadingSlug={clusterLoadingSlug}
          clusterLoadingLabel={germanyLoadingCity}
          resultsCitiesUnitLabel={resultsCitiesUnit}
          germanyClusterRevealLabel={germanyClusterRevealLabel}
        />

        <div className="mt-5">
          {!isGermanyClusterMode ? (
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-foreground">{resultsTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {viewportBounds ? (
                  <>
                    {listCount} {resultsSummaryUnitLabel}
                  </>
                ) : (
                  <span className="text-muted-foreground/80">—</span>
                )}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <DiscoveryMapListPanels
              locale={locale}
              listRatingReviewsSuffix={listRatingReviewsSuffix}
              viewportBounds={viewportBounds}
              normalized={normalized}
              filtered={filtered}
              listCount={listCount}
              hasActiveFilters={hasActiveFilters}
              listHintWhenNoPins={listHintWhenNoPins}
              awaitingMapViewport={awaitingMapViewport}
              empty={empty}
              noResults={noResults}
              noResultsInViewport={noResultsInViewport}
              legendPlaces={legendPlaces}
              legendEvents={legendEvents}
              filteredPlaces={filteredPlaces}
              filteredEvents={filteredEvents}
              totalFilteredPlaces={totalFilteredPlaces}
              totalFilteredEvents={totalFilteredEvents}
              activePointId={activePointId}
              viewPlaceLabel={viewPlaceLabel}
              viewEventLabel={viewEventLabel}
              setHoveredId={setHoveredId}
              onLeavePoint={onLeaveHoveredPoint}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
