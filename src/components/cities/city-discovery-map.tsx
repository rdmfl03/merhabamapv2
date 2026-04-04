"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import type { Dispatch, ErrorInfo, ReactNode, SetStateAction } from "react";
import { Component, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  Star,
} from "lucide-react";

import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import { Link } from "@/i18n/navigation";
import {
  formatEventDateRange,
  getEventCategoryLabelKey,
} from "@/lib/events";
import {
  computeMapScore,
  getLocalizedPlaceCategoryLabel,
  getPlaceDisplayRatingSummary,
  getLocalizedText,
} from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { CITY_DISCOVERY_MAP_RADIUS_KM } from "@/lib/cities/city-map-max-bounds";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import type { DiscoveryMapCityOption } from "@/server/queries/cities/get-discovery-map-cities";
import type {
  PublicDiscoveryMapEventRecord,
  PublicDiscoveryMapPlaceRecord,
} from "@/server/queries/cities/get-public-city-page";
import { cn } from "@/lib/utils";

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
} & PublicDiscoveryMapPlaceRecord;

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
} & PublicDiscoveryMapEventRecord;

type DiscoveryMapPinsResponse = {
  places: PublicDiscoveryMapPlaceRecord[];
  events: PublicDiscoveryMapEventRecord[];
};

const EMPTY_EFFECTIVE_PLACES: CityPlacePoint[] = [];
const EMPTY_EFFECTIVE_EVENTS: CityEventPoint[] = [];

function getDiscoveryMapFrameClass(isGermanyNationalMap: boolean) {
  return isGermanyNationalMap
    ? "relative isolate z-0 h-[44rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[58rem] xl:h-[64rem]"
    : "relative isolate z-0 h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]";
}

type DiscoveryMapLeafletErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
  retryLabel: string;
  frameClassName: string;
};

type DiscoveryMapLeafletErrorBoundaryState = {
  error: Error | null;
};

class DiscoveryMapLeafletErrorBoundary extends Component<
  DiscoveryMapLeafletErrorBoundaryProps,
  DiscoveryMapLeafletErrorBoundaryState
> {
  state: DiscoveryMapLeafletErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): DiscoveryMapLeafletErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CityDiscoveryMap] Leaflet error boundary:", error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className={this.props.frameClassName}>
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-semibold text-foreground">{this.props.title}</p>
            <p className="max-w-md text-sm text-muted-foreground">{this.props.description}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => this.setState({ error: null })}
            >
              {this.props.retryLabel}
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  categoriesFilterLabel: string;
  categoriesFilterHint: string;
  categoriesDropdownAll: string;
  categoriesDropdownMultiple: string;
  resetFiltersLabel: string;
  resultsTitle: string;
  /** z. B. „Bewertungen“ / „değerlendirme“ für die Trefferliste. */
  listRatingReviewsSuffix: string;
  resultsSummaryUnitLabel: string;
  viewPlaceLabel: string;
  placePopupRatingUnavailableAria: string;
  viewEventLabel: string;
  locateMeLabel: string;
  locatingLabel: string;
  myLocationLabel: string;
  categoryLabels: Record<string, string>;
  places: CityPlacePoint[];
  events: CityEventPoint[];
  isGermanyNationalMap?: boolean;
  /** When set (national map), map shows city clusters until one is opened. */
  germanyMapClusters?: GermanyMapCluster[] | null;
  germanyClusterHint?: string;
  germanyBackToOverview?: string;
  germanyClusterRevealLabel?: string;
  resultsCitiesUnit?: string;
  mapLoadErrorTitle: string;
  mapLoadErrorBody: string;
  mapLoadErrorRetry: string;
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
      searchHaystack: string;
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
      searchHaystack: string;
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
  categoriesFilterLabel,
  categoriesFilterHint,
  categoriesDropdownAll,
  categoriesDropdownMultiple,
  resetFiltersLabel,
  resultsTitle,
  listRatingReviewsSuffix,
  resultsSummaryUnitLabel,
  viewPlaceLabel,
  placePopupRatingUnavailableAria,
  viewEventLabel,
  locateMeLabel,
  locatingLabel,
  myLocationLabel,
  categoryLabels,
  places,
  events,
  isGermanyNationalMap = false,
  germanyMapClusters,
  germanyClusterHint = "",
  germanyBackToOverview = "",
  germanyClusterRevealLabel = "",
  resultsCitiesUnit = "",
  mapLoadErrorTitle,
  mapLoadErrorBody,
  mapLoadErrorRetry,
}: CityDiscoveryMapProps) {
  const frameClassName = getDiscoveryMapFrameClass(isGermanyNationalMap);
  const [cityPickerValue, setCityPickerValue] = useState(selectedCitySlug);
  const [typeFilter, setTypeFilter] = useState<"all" | "place" | "event">("all");
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewportBounds, setViewportBounds] = useState<MapViewportBounds | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const pinsCacheRef = useRef<Map<string, DiscoveryMapPinsResponse>>(new Map());
  const [loadedPins, setLoadedPins] = useState<DiscoveryMapPinsResponse | null>(() =>
    selectedCitySlug
      ? null
      : {
          places,
          events,
        },
  );
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const isGermanyClusterMode =
    germanyMapClusters != null && selectedCitySlug === "";
  const isCityPinsLoading = !isGermanyClusterMode && selectedCitySlug.length > 0 && loadedPins == null;
  const deferredQuery = useDeferredValue(query);
  const deferredTypeFilter = useDeferredValue(typeFilter);
  const deferredSelectedCategoryKeys = useDeferredValue(selectedCategoryKeys);
  const resolvedPlaces = loadedPins?.places ?? places;
  const resolvedEvents = loadedPins?.events ?? events;
  /** Deutschland-Übersicht: nur Cluster, keine Einzelpins (Server liefert hier leere map-Arrays). */
  const effectivePlaces = useMemo(
    () => (isGermanyClusterMode ? EMPTY_EFFECTIVE_PLACES : resolvedPlaces),
    [isGermanyClusterMode, resolvedPlaces],
  );
  const effectiveEvents = useMemo(
    () => (isGermanyClusterMode ? EMPTY_EFFECTIVE_EVENTS : resolvedEvents),
    [isGermanyClusterMode, resolvedEvents],
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
    setCategoryMenuOpen(false);
  }, [selectedCitySlug]);

  useEffect(() => {
    if (!selectedCitySlug) {
      setLoadedPins({
        places,
        events,
      });
      return;
    }

    const controller = new AbortController();
    const cachedPins = pinsCacheRef.current.get(selectedCitySlug);
    if (cachedPins) {
      setLoadedPins(cachedPins);
      return () => controller.abort();
    }

    setLoadedPins(null);

    fetch(`/api/discovery/map-pins?city=${encodeURIComponent(selectedCitySlug)}`, {
      signal: controller.signal,
      cache: "force-cache",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load discovery map pins for ${selectedCitySlug}`);
        }
        const payload = (await response.json()) as DiscoveryMapPinsResponse;
        const nextPins = {
          places: Array.isArray(payload.places) ? payload.places : [],
          events: Array.isArray(payload.events) ? payload.events : [],
        };
        pinsCacheRef.current.set(selectedCitySlug, nextPins);
        setLoadedPins(nextPins);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error("[CityDiscoveryMap] failed to load map pins:", error);
        setLoadedPins({
          places,
          events,
        });
      });

    return () => controller.abort();
  }, [events, places, selectedCitySlug]);

  useEffect(() => {
    if (!categoryMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = categoryDropdownRef.current;
      if (el && !el.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryMenuOpen]);

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
    (slug: string) => {
      window.location.assign(`/${locale}/map?city=${encodeURIComponent(slug)}`);
    },
    [locale],
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
        const description = getLocalizedText(
          { de: place.descriptionDe, tr: place.descriptionTr },
          locale,
          "",
        );
        const categoryLabel = getLocalizedPlaceCategoryLabel(place.category, locale);
        const meta = getLocalizedCityDisplayName(locale, place.city);
        const mapAddressLine = formatMapPlaceAddressLine(locale, place);
        return {
          id: `place-${place.id}`,
          kind: "place" as const,
          label: place.name,
          href: `/places/${place.slug}`,
          description,
          latitude: place.latitude as number,
          longitude: place.longitude as number,
          categoryKey: place.category.slug,
          categoryLabel,
          meta,
          searchHaystack:
            `${place.name} ${description} ${categoryLabel} ${meta} ${mapAddressLine ?? ""}`
              .toLowerCase(),
          mapAddressLine,
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
      .map((event) => {
        const description = getLocalizedText(
          { de: event.descriptionDe, tr: event.descriptionTr },
          locale,
          "",
        );
        const categoryKey = getEventCategoryLabelKey(event.category as never);
        const categoryLabel = categoryLabels[categoryKey] ?? event.category;
        const meta = formatEventDateRange(
          locale,
          new Date(event.startsAt),
          event.endsAt != null ? new Date(event.endsAt) : null,
        );
        return {
          id: `event-${event.id}`,
          kind: "event" as const,
          label: event.title,
          href: `/events/${event.slug}`,
          description,
          latitude: event.latitude as number,
          longitude: event.longitude as number,
          categoryKey,
          categoryLabel,
          meta,
          searchHaystack: `${event.title} ${description} ${categoryLabel} ${meta}`.toLowerCase(),
          tone: "dark" as const,
        };
      });

    return [...normalizedPlaces, ...normalizedEvents];
  }, [categoryLabels, effectiveEvents, effectivePlaces, locale]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Map(
        normalized.map((point) => [point.categoryKey, point.categoryLabel]),
      ).entries(),
    ).map(([key, label]) => ({ key, label }));
  }, [normalized]);

  const validCategoryKeysSignature = useMemo(
    () => [...new Set(normalized.map((point) => point.categoryKey))].sort().join(","),
    [normalized],
  );

  useEffect(() => {
    const valid = new Set(
      validCategoryKeysSignature.length > 0 ? validCategoryKeysSignature.split(",") : [],
    );
    setSelectedCategoryKeys((prev) => {
      const next = prev.filter((key) => valid.has(key));
      return next.length === prev.length && next.every((key, index) => key === prev[index])
        ? prev
        : next;
    });
  }, [validCategoryKeysSignature]);

  const toggleCategoryKey = useCallback((key: string) => {
    setSelectedCategoryKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const categoryTriggerLabel = useMemo(() => {
    if (selectedCategoryKeys.length === 0) {
      return categoriesDropdownAll;
    }
    if (selectedCategoryKeys.length === 1) {
      const only = categoryOptions.find((c) => c.key === selectedCategoryKeys[0]);
      return only?.label ?? categoriesDropdownAll;
    }
    return categoriesDropdownMultiple.replace(
      /\{count\}/g,
      String(selectedCategoryKeys.length),
    );
  }, [
    categoriesDropdownAll,
    categoriesDropdownMultiple,
    categoryOptions,
    selectedCategoryKeys,
  ]);

  const deferredSelectedCategoryKeySet = useMemo(
    () => new Set(deferredSelectedCategoryKeys),
    [deferredSelectedCategoryKeys],
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return normalized.filter((point) => {
      if (deferredTypeFilter !== "all" && point.kind !== deferredTypeFilter) {
        return false;
      }

      if (
        deferredSelectedCategoryKeySet.size > 0 &&
        !deferredSelectedCategoryKeySet.has(point.categoryKey)
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return point.searchHaystack.includes(q);
    });
  }, [deferredQuery, deferredSelectedCategoryKeySet, deferredTypeFilter, normalized]);

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
      const mapRatingReviewsLine =
        mapRatingLabel != null && point.mapRatingReviewCount != null
          ? `(${new Intl.NumberFormat(ratingLocale).format(point.mapRatingReviewCount)})`
          : null;
      return {
        ...base,
        mapAddressLine: point.mapAddressLine,
        mapRatingLabel,
        mapRatingReviewsLine,
      };
    });
  }, [filtered, locale]);

  const hasActiveFilters = Boolean(
    query || selectedCategoryKeys.length > 0 || typeFilter !== "all",
  );
  const activePointId = selectedId ?? hoveredId;
  const onLeaveHoveredPoint = useCallback((id: string) => {
    setHoveredId((current) => (current === id ? null : current));
  }, []);
  const listSource = viewportBounds ? inViewFiltered : null;
  const placeLookupByPointId = useMemo(
    () =>
      new Map<string, CityPlacePoint>(
        effectivePlaces.map((place) => [`place-${place.id}`, place] as const),
      ),
    [effectivePlaces],
  );
  const listBuckets = useMemo(() => {
    if (!listSource) {
      return {
        places: [] as NormalizedPoint[],
        events: [] as NormalizedPoint[],
      };
    }

    const places: NormalizedPoint[] = [];
    const events: NormalizedPoint[] = [];

    for (const point of listSource) {
      if (point.kind === "place") {
        places.push(point);
      } else {
        events.push(point);
      }
    }

    return { places, events };
  }, [listSource]);

  const filteredPlaces = useMemo(
    () =>
      listBuckets.places.length > 0
        ? [...listBuckets.places]
            .sort((a, b) => {
              const placeA = placeLookupByPointId.get(a.id);
              const placeB = placeLookupByPointId.get(b.id);

                const scoreDiff =
                computeMapScore(
                  (placeB ?? {}) as Parameters<typeof computeMapScore>[0],
                  null,
                ) -
                computeMapScore(
                  (placeA ?? {}) as Parameters<typeof computeMapScore>[0],
                  null,
                );
              if (scoreDiff !== 0) {
                return scoreDiff;
              }

              return Number(b.id === selectedId) - Number(a.id === selectedId);
            })
            .slice(0, 5)
        : [],
    [listBuckets.places, placeLookupByPointId, selectedId],
  );

  const listHintWhenNoPins =
    isGermanyClusterMode &&
    germanyClusterHint &&
    (germanyMapClusters?.length ?? 0) > 0
      ? germanyClusterHint
      : null;
  const filteredEvents = useMemo(
    () =>
      listBuckets.events.length > 0
        ? [...listBuckets.events]
            .sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId))
            .slice(0, 5)
        : [],
    [listBuckets.events, selectedId],
  );
  const totalFilteredPlaces = useMemo(
    () => listBuckets.places.length,
    [listBuckets.places],
  );
  const totalFilteredEvents = useMemo(
    () => listBuckets.events.length,
    [listBuckets.events],
  );
  const listCount = listSource?.length ?? 0;

  function resetFilters() {
    setQuery("");
    setSelectedCategoryKeys([]);
    setCategoryMenuOpen(false);
    setTypeFilter("all");
    setHoveredId(null);
    setSelectedId(null);
  }

  function handleCityPickerChange(slug: string) {
    const path = slug
      ? `/${locale}/map?city=${encodeURIComponent(slug)}`
      : `/${locale}/map`;
    window.location.assign(path);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-[#f5f6f8]">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            {isGermanyNationalMap ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {cityName}
              </p>
            ) : null}
            <h2 className="mt-1 font-display text-2xl text-foreground sm:text-[2rem]">
              {isGermanyNationalMap ? title : cityName}
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
            className={cn(
              "h-11 rounded-2xl border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isGermanyNationalMap ? "w-full max-w-md" : "w-full max-w-[14rem]",
            )}
            aria-label={cityPickerLabel}
          >
            <option value="">{cityPickerAllLabel}</option>
            {mapCityOptions.map((city) => (
              <option key={city.slug} value={city.slug}>
                {getLocalizedCityDisplayName(locale, city)}
              </option>
            ))}
          </select>
          {!isGermanyNationalMap ? (
            <>
              <div className="relative min-w-0 flex-1 basis-[min(100%,22rem)]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-11"
                />
              </div>
            </>
          ) : null}
        </div>

        {!isGermanyNationalMap ? (
          <div className="mb-5 rounded-[1.5rem] border border-border/70 bg-white/72 p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[12rem] flex-1 basis-[min(100%,16rem)]">
                {categoryOptions.length > 0 ? (
                  <div
                    ref={categoryDropdownRef}
                    className="relative"
                  >
                    <button
                      type="button"
                      id="discovery-category-dropdown-trigger"
                      aria-expanded={categoryMenuOpen}
                      aria-haspopup="listbox"
                      aria-label={categoriesFilterLabel}
                      onClick={() => setCategoryMenuOpen((open) => !open)}
                      className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 text-left text-sm text-foreground shadow-sm outline-none transition hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0 truncate">{categoryTriggerLabel}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          categoryMenuOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {categoryMenuOpen ? (
                      <div
                        className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-lg"
                        role="listbox"
                        aria-labelledby="discovery-category-dropdown-trigger"
                        aria-multiselectable="true"
                      >
                        <p className="mb-2 text-xs text-muted-foreground">{categoriesFilterHint}</p>
                        <div className="flex flex-col gap-1">
                          {categoryOptions.map((category) => {
                            const checked = selectedCategoryKeys.includes(category.key);
                            return (
                              <label
                                key={category.key}
                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground hover:bg-muted/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCategoryKey(category.key)}
                                  className="h-4 w-4 shrink-0 rounded border-border text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                                <span>{category.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
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
              </div>

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
          </div>
        ) : null}

        <DiscoveryMapLeafletErrorBoundary
          title={mapLoadErrorTitle}
          description={mapLoadErrorBody}
          retryLabel={mapLoadErrorRetry}
          frameClassName={frameClassName}
        >
          <CityDiscoveryInteractiveMap
            points={mapPoints}
            cityCenter={cityCenter}
            selectedId={selectedId}
            onHoverChange={setHoveredId}
            onSelectChange={setSelectedId}
            emptyLabel={empty}
            noResultsLabel={noResults}
            filtered={Boolean(
              query || selectedCategoryKeys.length > 0 || typeFilter !== "all",
            )}
            legendPlaces={legendPlaces}
            legendEvents={legendEvents}
            resultsSummaryUnitLabel={resultsSummaryUnitLabel}
            viewPlaceLabel={viewPlaceLabel}
            placePopupRatingUnavailableAria={placePopupRatingUnavailableAria}
            viewEventLabel={viewEventLabel}
            locateMeLabel={locateMeLabel}
            locatingLabel={locatingLabel}
            myLocationLabel={myLocationLabel}
            isGermanyNationalMap={isGermanyNationalMap}
            onViewportBoundsChange={handleViewportBounds}
            germanyCityClusters={germanyClusterMarkers}
            onGermanyCityClusterClick={
              isGermanyClusterMode ? handleGermanyClusterClick : undefined
            }
            mapLayoutEpoch={0}
            resultsCitiesUnitLabel={resultsCitiesUnit}
            germanyClusterRevealLabel={germanyClusterRevealLabel}
            restrictToCityRadiusKm={
              isGermanyClusterMode ? null : CITY_DISCOVERY_MAP_RADIUS_KM
            }
          />
        </DiscoveryMapLeafletErrorBoundary>

        <div className="mt-5">
          {!isGermanyClusterMode ? (
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-foreground">{resultsTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {isCityPinsLoading ? (
                  <span className="text-muted-foreground/80">…</span>
                ) : viewportBounds ? (
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
              listHintWhenNoPins={isCityPinsLoading ? awaitingMapViewport : listHintWhenNoPins}
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
