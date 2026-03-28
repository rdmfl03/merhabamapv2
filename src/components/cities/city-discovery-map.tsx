"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Crosshair, LocateFixed, MapPin, Search } from "lucide-react";

import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import { Link, useRouter } from "@/i18n/navigation";
import { formatEventDateRange, getEventCategoryLabelKey } from "@/lib/events";
import {
  computeMapScore,
  getLocalizedPlaceCategoryLabel,
  getLocalizedText,
} from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DiscoveryMapCityOption } from "@/server/queries/cities/get-discovery-map-cities";

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
  displayRatingValue?: number | string | { toString(): string } | null;
  displayRatingCount?: number | null;
  ratingSourceCount?: number | null;
  verificationStatus: string;
};

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
  startsAt: Date;
  endsAt: Date | null;
};

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
  resultsSummaryUnitLabel: string;
  viewPlaceLabel: string;
  viewEventLabel: string;
  locateMeLabel: string;
  locatingLabel: string;
  locationUnavailableLabel: string;
  myLocationLabel: string;
  categoryLabels: Record<string, string>;
  places: CityPlacePoint[];
  events: CityEventPoint[];
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

const CityDiscoveryInteractiveMap = dynamic(
  () =>
    process.env.NEXT_PUBLIC_MAP_PROVIDER === "mapbox" &&
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      ? import("./city-discovery-mapbox-map").then(
          (module) => module.CityDiscoveryMapboxMap,
        )
      : import("./city-discovery-leaflet-map").then(
          (module) => module.CityDiscoveryLeafletMap,
        ),
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
  resultsSummaryUnitLabel,
  viewPlaceLabel,
  viewEventLabel,
  locateMeLabel,
  locatingLabel,
  locationUnavailableLabel,
  myLocationLabel,
  categoryLabels,
  places,
  events,
}: CityDiscoveryMapProps) {
  const router = useRouter();
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

  const handleViewportBounds = useCallback((bounds: MapViewportBounds) => {
    setViewportBounds(bounds);
  }, []);

  useEffect(() => {
    setViewportBounds(null);
  }, [selectedCitySlug]);

  const normalized = useMemo<NormalizedPoint[]>(() => {
    const normalizedPlaces = places
      .filter(
        (place) =>
          typeof place.latitude === "number" && typeof place.longitude === "number",
      )
      .map((place) => ({
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
        meta:
          locale === "tr"
            ? place.city.nameTr
            : place.city.nameDe,
        tone: "brand" as const,
      }));

    const normalizedEvents = events
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
        meta: formatEventDateRange(locale, new Date(event.startsAt), event.endsAt),
        tone: "dark" as const,
      }));

    return [...normalizedPlaces, ...normalizedEvents];
  }, [categoryLabels, events, locale, places]);

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

      const haystack = `${point.label} ${point.description} ${point.categoryLabel} ${point.meta}`.toLowerCase();
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

  const markersForMap = useMemo(() => {
    return viewportBounds ? inViewFiltered : filtered;
  }, [filtered, inViewFiltered, viewportBounds]);

  const mapPoints = useMemo<CityMapPoint[]>(
    () =>
      markersForMap.map((point) => ({
        id: point.id,
        kind: point.kind,
        label: point.label,
        href: point.href,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
        categoryLabel: point.categoryLabel,
        meta: point.meta,
      })),
    [markersForMap],
  );

  const hasActiveFilters = Boolean(
    query || categoryFilter !== "all" || typeFilter !== "all",
  );
  const activePointId = selectedId ?? hoveredId;
  const listSource = viewportBounds ? inViewFiltered : null;

  const filteredPlaces = useMemo(
    () =>
      listSource
        ? [...listSource]
            .filter((point) => point.kind === "place")
            .sort((a, b) => {
              const placeA = places.find((place) => `place-${place.id}` === a.id);
              const placeB = places.find((place) => `place-${place.id}` === b.id);

              const scoreDiff =
                computeMapScore(placeB ?? {}, userLocation) -
                computeMapScore(placeA ?? {}, userLocation);
              if (scoreDiff !== 0) {
                return scoreDiff;
              }

              return Number(b.id === selectedId) - Number(a.id === selectedId);
            })
            .slice(0, 10)
        : [],
    [listSource, places, selectedId, userLocation],
  );
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
    if (!slug) {
      router.push("/map");
      return;
    }
    router.push(`/map?city=${slug}`);
  }

  function renderPointCard(point: NormalizedPoint) {
    return (
      <Link
        key={point.id}
        href={point.href}
        className={`block rounded-[1.5rem] border p-4 transition ${
          activePointId === point.id
            ? "border-brand/40 bg-brand-soft/60 shadow-sm"
            : "border-border/70 bg-white/92 hover:border-brand/30 hover:bg-white"
        }`}
        onMouseEnter={() => setHoveredId(point.id)}
        onFocus={() => setHoveredId(point.id)}
        onMouseLeave={() =>
          setHoveredId((current) => (current === point.id ? null : current))
        }
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
            <p className="text-sm leading-6 text-muted-foreground">
              {point.description || point.meta}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-foreground">
            {point.kind === "place" ? viewPlaceLabel : viewEventLabel}
          </span>
        </div>
      </Link>
    );
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

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(10rem,0.95fr)_minmax(0,1.25fr)_minmax(0,0.7fr)_auto]">
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="sr-only sm:not-sr-only">{cityPickerLabel}</span>
            <select
              value={selectedCitySlug}
              onChange={(event) => handleCityPickerChange(event.target.value)}
              className="h-11 w-full min-w-0 rounded-2xl border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={cityPickerLabel}
            >
              <option value="">{cityPickerAllLabel}</option>
              {mapCityOptions.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {locale === "tr" ? city.nameTr : city.nameDe}
                </option>
              ))}
            </select>
          </label>
          <div className="relative">
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
            className="h-11 rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="h-11 px-4"
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

        <CityDiscoveryInteractiveMap
          points={mapPoints}
          cityCenter={cityCenter}
          activeId={selectedId ?? hoveredId}
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
          viewEventLabel={viewEventLabel}
          myLocationLabel={myLocationLabel}
          onViewportBoundsChange={handleViewportBounds}
        />

        <div className="mt-5">
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

          <div className="grid gap-4 lg:grid-cols-2">
            {!viewportBounds ? (
              <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
                {awaitingMapViewport}
              </div>
            ) : normalized.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
                {empty}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
                {hasActiveFilters ? noResults : empty}
              </div>
            ) : listCount === 0 ? (
              <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
                {noResultsInViewport}
              </div>
            ) : (
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
                    filteredPlaces.map((point) => renderPointCard(point))
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
                    filteredEvents.map((point) => renderPointCard(point))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-white/75 px-4 py-5 text-sm text-muted-foreground">
                      {legendEvents}: 0
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
