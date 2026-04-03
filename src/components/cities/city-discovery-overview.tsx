"use client";

import type { ReactNode } from "react";

import { CityDiscoveryMap } from "@/components/cities/city-discovery-map";
import { EventCard } from "@/components/events/event-card";
import { PlaceCard } from "@/components/places/place-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import type {
  PublicDiscoveryMapEventRecord,
  PublicDiscoveryMapPlaceRecord,
} from "@/server/queries/cities/get-public-city-page";
import type { PublicEventRecord } from "@/server/queries/events/shared";
import type { PublicPlaceRecord } from "@/server/queries/places/shared";
import type { DiscoveryMapCityOption } from "@/server/queries/cities/get-discovery-map-cities";

type CityPlaceCardRecord = PublicPlaceRecord & {
  isSaved: boolean;
};

type CityEventCardRecord = PublicEventRecord & {
  isSaved: boolean;
};

type CityDiscoveryOverviewProps = {
  locale: "de" | "tr";
  city: {
    slug: string;
    name: string;
    isPilot: boolean;
    center: {
      latitude: number;
      longitude: number;
    } | null;
  };
  mapCityOptions: DiscoveryMapCityOption[];
  selectedMapCitySlug: string | null;
  placesListHref: string;
  eventsListHref: string;
  cardReturnPath: string;
  explorePlacesLinkLabel: string;
  exploreEventsLinkLabel: string;
  placeCount: number;
  eventCount: number;
  featuredPlaces: CityPlaceCardRecord[];
  mapPlaces: PublicDiscoveryMapPlaceRecord[];
  upcomingEvents: CityEventCardRecord[];
  mapEvents: PublicDiscoveryMapEventRecord[];
  isAuthenticated: boolean;
  germanyMapClusters?: GermanyMapCluster[] | null;
  /** Nur bei konkreter Stadt (?city=…): Stadt folgen / entfolgen */
  cityFollowSlot?: ReactNode;
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    statsPlaces: string;
    statsEvents: string;
    mapTitle: string;
    mapDescription: string;
    mapEmpty: string;
    noResults: string;
    noResultsInViewport: string;
    awaitingMapViewport: string;
    cityPickerLabel: string;
    cityPickerAll: string;
    searchPlaceholder: string;
    allResults: string;
    placesOnly: string;
    eventsOnly: string;
    categoriesFilterLabel: string;
    categoriesFilterHint: string;
    categoriesDropdownAll: string;
    categoriesDropdownMultiple: string;
    resetFilters: string;
    resultsTitle: string;
    listRatingReviewsSuffix: string;
    resultsSummaryUnit: string;
    viewPlace: string;
    popupPlaceRating: string;
    viewEvent: string;
    locateMe: string;
    locating: string;
    locationUnavailable: string;
    myLocation: string;
    legendPlaces: string;
    legendEvents: string;
    placesCta: string;
    eventsCta: string;
    signUpCta: string;
    featuredPlaces: string;
    featuredEvents: string;
    emptyPlaces: string;
    emptyEvents: string;
    cardDetails: string;
    cardSave: string;
    cardSaved: string;
    cardSaving: string;
    cardSignIn: string;
    cardVerified: string;
    eventExternal: string;
    placeFallback: string;
    eventFallback: string;
    eventCategoryLabels: Record<string, string>;
    germanyClusterHint?: string;
    germanyBackToOverview?: string;
    germanyClusterRevealLabel?: string;
    germanyLoadingCity?: string;
    resultsCitiesUnit?: string;
    mapLoadErrorTitle: string;
    mapLoadErrorBody: string;
    mapLoadErrorRetry: string;
  };
};

export function CityDiscoveryOverview({
  locale,
  city,
  mapCityOptions,
  selectedMapCitySlug,
  placesListHref,
  eventsListHref,
  cardReturnPath,
  explorePlacesLinkLabel,
  exploreEventsLinkLabel,
  placeCount,
  eventCount,
  featuredPlaces,
  mapPlaces,
  upcomingEvents,
  mapEvents,
  isAuthenticated,
  germanyMapClusters = null,
  cityFollowSlot,
  labels,
}: CityDiscoveryOverviewProps) {
  const isGermanyNationalMap =
    Boolean(germanyMapClusters?.length) && !selectedMapCitySlug;
  /** Unter der Karte: auf der reinen Deutschland-Karte keine Featured-Grids; mit ?city=… wie gewohnt. */
  const showFeaturedBelowMap = !isGermanyNationalMap;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:py-10">
      <section className="space-y-5">
        <div className="rounded-[2rem] border border-border/60 bg-white/55 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-7 sm:py-6">
          <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {labels.eyebrow}
              </p>
              <h1 className="font-display text-4xl text-foreground sm:text-[3.4rem] sm:leading-none">
                {labels.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.05rem]">
                {labels.description}
              </p>
          </div>

          {isGermanyNationalMap ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild>
                <Link href={placesListHref}>{labels.placesCta}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={eventsListHref}>{labels.eventsCta}</Link>
              </Button>
              {!isAuthenticated ? (
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  {labels.signUpCta}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {cityFollowSlot}
                {labels.germanyBackToOverview ? (
                  <Link
                    href="/map"
                    className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    {labels.germanyBackToOverview}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <CityDiscoveryMap
          locale={locale}
          cityName={city.name}
          cityCenter={city.center}
          title={labels.mapTitle}
          description={labels.mapDescription}
          placeCount={placeCount}
          eventCount={eventCount}
          mapCityOptions={mapCityOptions}
          selectedCitySlug={selectedMapCitySlug ?? ""}
          cityPickerLabel={labels.cityPickerLabel}
          cityPickerAllLabel={labels.cityPickerAll}
          legendPlaces={labels.legendPlaces}
          legendEvents={labels.legendEvents}
          empty={labels.mapEmpty}
          noResults={labels.noResults}
          noResultsInViewport={labels.noResultsInViewport}
          awaitingMapViewport={labels.awaitingMapViewport}
          searchPlaceholder={labels.searchPlaceholder}
          allLabel={labels.allResults}
          placesOnlyLabel={labels.placesOnly}
          eventsOnlyLabel={labels.eventsOnly}
          categoriesFilterLabel={labels.categoriesFilterLabel}
          categoriesFilterHint={labels.categoriesFilterHint}
          categoriesDropdownAll={labels.categoriesDropdownAll}
          categoriesDropdownMultiple={labels.categoriesDropdownMultiple}
          resetFiltersLabel={labels.resetFilters}
          resultsTitle={labels.resultsTitle}
          listRatingReviewsSuffix={labels.listRatingReviewsSuffix}
          resultsSummaryUnitLabel={labels.resultsSummaryUnit}
          viewPlaceLabel={labels.viewPlace}
          placePopupRatingCaption={labels.popupPlaceRating}
          viewEventLabel={labels.viewEvent}
          locateMeLabel={labels.locateMe}
          locatingLabel={labels.locating}
          locationUnavailableLabel={labels.locationUnavailable}
          myLocationLabel={labels.myLocation}
          categoryLabels={labels.eventCategoryLabels}
          places={mapPlaces}
          events={mapEvents}
          isGermanyNationalMap={isGermanyNationalMap}
          germanyMapClusters={germanyMapClusters}
          germanyClusterHint={labels.germanyClusterHint}
          germanyBackToOverview={labels.germanyBackToOverview}
          germanyClusterRevealLabel={labels.germanyClusterRevealLabel}
          resultsCitiesUnit={labels.resultsCitiesUnit}
          mapLoadErrorTitle={labels.mapLoadErrorTitle}
          mapLoadErrorBody={labels.mapLoadErrorBody}
          mapLoadErrorRetry={labels.mapLoadErrorRetry}
        />
      </section>

      {showFeaturedBelowMap ? (
        <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">{labels.featuredPlaces}</h2>
          <Link href={placesListHref} className="text-sm text-brand">
            {explorePlacesLinkLabel}
          </Link>
        </div>
        {featuredPlaces.length === 0 ? (
          <Card className="bg-white/90">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {labels.emptyPlaces}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                locale={locale}
                description={getLocalizedText(
                  { de: place.descriptionDe, tr: place.descriptionTr },
                  locale,
                  labels.placeFallback,
                )}
                categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                returnPath={cardReturnPath}
                isAuthenticated={isAuthenticated}
                labels={{
                  details: labels.cardDetails,
                  save: labels.cardSave,
                  saved: labels.cardSaved,
                  saving: labels.cardSaving,
                  signIn: labels.cardSignIn,
                  verified: labels.cardVerified,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">{labels.featuredEvents}</h2>
          <Link href={eventsListHref} className="text-sm text-brand">
            {exploreEventsLinkLabel}
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <Card className="bg-white/90">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {labels.emptyEvents}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                description={getLocalizedEventText(
                  { de: event.descriptionDe, tr: event.descriptionTr },
                  locale,
                  labels.eventFallback,
                )}
                categoryLabel={
                  labels.eventCategoryLabels[getEventCategoryLabelKey(event.category)]
                }
                cityLabel={getLocalizedCityDisplayName(locale, event.city)}
                returnPath={cardReturnPath}
                isAuthenticated={isAuthenticated}
                labels={{
                  details: labels.cardDetails,
                  save: labels.cardSave,
                  saved: labels.cardSaved,
                  saving: labels.cardSaving,
                  signIn: labels.cardSignIn,
                  external: labels.eventExternal,
                }}
              />
            ))}
          </div>
        )}
      </section>
        </>
      ) : null}
    </div>
  );
}
