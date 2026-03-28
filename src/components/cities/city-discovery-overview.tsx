import { CityDiscoveryMap } from "@/components/cities/city-discovery-map";
import { EventCard } from "@/components/events/event-card";
import { PlaceCard } from "@/components/places/place-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import type { PublicEventRecord } from "@/server/queries/events/shared";
import type { PublicPlaceRecord } from "@/server/queries/places/shared";

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
  placesListHref: string;
  eventsListHref: string;
  cardReturnPath: string;
  explorePlacesLinkLabel: string;
  exploreEventsLinkLabel: string;
  placeCount: number;
  eventCount: number;
  featuredPlaces: CityPlaceCardRecord[];
  mapPlaces: CityPlaceCardRecord[];
  upcomingEvents: CityEventCardRecord[];
  mapEvents: CityEventCardRecord[];
  isAuthenticated: boolean;
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    statsPlaces: string;
    statsEvents: string;
    statsPilot: string;
    statsPilotValue: string;
    mapTitle: string;
    mapDescription: string;
    mapEmpty: string;
    noResults: string;
    searchPlaceholder: string;
    allResults: string;
    placesOnly: string;
    eventsOnly: string;
    allCategories: string;
    resetFilters: string;
    resultsTitle: string;
    resultsSummaryUnit: string;
    viewPlace: string;
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
  };
};

export function CityDiscoveryOverview({
  locale,
  city,
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
  labels,
}: CityDiscoveryOverviewProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-12">
      <section className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            {labels.eyebrow}
          </p>
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">
            {labels.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {labels.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={placesListHref}>{labels.placesCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={eventsListHref}>{labels.eventsCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">{labels.signUpCta}</Link>
            </Button>
          </div>
        </div>

        <CityDiscoveryMap
          locale={locale}
          cityName={city.name}
          cityCenter={city.center}
          title={labels.mapTitle}
          description={labels.mapDescription}
          placeCount={placeCount}
          eventCount={eventCount}
          pilotLabel={labels.statsPilot}
          pilotValue={labels.statsPilotValue}
          legendPlaces={labels.legendPlaces}
          legendEvents={labels.legendEvents}
          empty={labels.mapEmpty}
          noResults={labels.noResults}
          searchPlaceholder={labels.searchPlaceholder}
          allLabel={labels.allResults}
          placesOnlyLabel={labels.placesOnly}
          eventsOnlyLabel={labels.eventsOnly}
          allCategoriesLabel={labels.allCategories}
          resetFiltersLabel={labels.resetFilters}
          resultsTitle={labels.resultsTitle}
          resultsSummaryUnitLabel={labels.resultsSummaryUnit}
          viewPlaceLabel={labels.viewPlace}
          viewEventLabel={labels.viewEvent}
          locateMeLabel={labels.locateMe}
          locatingLabel={labels.locating}
          locationUnavailableLabel={labels.locationUnavailable}
          myLocationLabel={labels.myLocation}
          categoryLabels={labels.eventCategoryLabels}
          places={mapPlaces}
          events={mapEvents}
        />
      </section>

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
                cityLabel={locale === "tr" ? place.city.nameTr : place.city.nameDe}
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
                cityLabel={locale === "tr" ? event.city.nameTr : event.city.nameDe}
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
    </div>
  );
}
