"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CalendarDays, Crosshair, LocateFixed, MapPin, Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatEventDateRange, getEventCategoryLabelKey } from "@/lib/events";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CityMapPoint } from "@/components/cities/city-discovery-map-types";

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
  pilotLabel: string;
  pilotValue: string;
  legendPlaces: string;
  legendEvents: string;
  empty: string;
  noResults: string;
  searchPlaceholder: string;
  allLabel: string;
  placesOnlyLabel: string;
  eventsOnlyLabel: string;
  allCategoriesLabel: string;
  resetFiltersLabel: string;
  resultsTitle: string;
  resultsSummaryLabel: string;
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
  pilotLabel,
  pilotValue,
  legendPlaces,
  legendEvents,
  empty,
  noResults,
  searchPlaceholder,
  allLabel,
  placesOnlyLabel,
  eventsOnlyLabel,
  allCategoriesLabel,
  resetFiltersLabel,
  resultsTitle,
  resultsSummaryLabel,
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

  const mapPoints = useMemo<CityMapPoint[]>(
    () =>
      filtered.map((point) => ({
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
    [filtered],
  );

  const hasActiveFilters = Boolean(
    query || categoryFilter !== "all" || typeFilter !== "all",
  );

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
            <div className="rounded-full border border-border bg-white/92 px-3 py-2">
              <span className="font-semibold text-foreground">{pilotLabel}:</span> {pilotValue}
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[1.3fr_0.7fr_auto]">
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
          resultsSummaryLabel={resultsSummaryLabel}
          viewPlaceLabel={viewPlaceLabel}
          viewEventLabel={viewEventLabel}
          myLocationLabel={myLocationLabel}
        />

        <div className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl text-foreground">{resultsTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {resultsSummaryLabel.replace("{count}", String(filtered.length))}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white/90 px-4 py-5 text-sm text-muted-foreground lg:col-span-2">
                {query || categoryFilter !== "all" || typeFilter !== "all"
                  ? noResults
                  : empty}
              </div>
            ) : (
              filtered.map((point) => (
                <Link
                  key={point.id}
                  href={point.href}
                  className={`block rounded-[1.5rem] border p-4 transition ${
                    (selectedId ?? hoveredId) === point.id
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
