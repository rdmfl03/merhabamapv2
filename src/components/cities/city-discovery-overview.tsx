import { EventCard } from "@/components/events/event-card";
import { PlaceCard } from "@/components/places/place-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedText } from "@/lib/places";

type CityDiscoveryOverviewProps = {
  locale: "de" | "tr";
  city: {
    slug: string;
    name: string;
    isPilot: boolean;
  };
  placeCount: number;
  eventCount: number;
  featuredPlaces: any[];
  upcomingEvents: any[];
  isAuthenticated: boolean;
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    statsPlaces: string;
    statsEvents: string;
    statsPilot: string;
    statsPilotValue: string;
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
    cardClaimed: string;
    eventExternal: string;
    placeFallback: string;
    eventFallback: string;
    exploreCityPlaces: string;
    exploreCityEvents: string;
    eventCategoryLabels: Record<string, string>;
  };
};

export function CityDiscoveryOverview({
  locale,
  city,
  placeCount,
  eventCount,
  featuredPlaces,
  upcomingEvents,
  isAuthenticated,
  labels,
}: CityDiscoveryOverviewProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-12">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
              <Link href={`/places?city=${city.slug}`}>{labels.placesCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/events?city=${city.slug}`}>{labels.eventsCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">{labels.signUpCta}</Link>
            </Button>
          </div>
        </div>

        <Card className="bg-white/90">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{labels.statsPlaces}</p>
              <p className="mt-1 font-display text-3xl text-foreground">{placeCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{labels.statsEvents}</p>
              <p className="mt-1 font-display text-3xl text-foreground">{eventCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{labels.statsPilot}</p>
              <p className="mt-1 font-display text-3xl text-foreground">{labels.statsPilotValue}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">{labels.featuredPlaces}</h2>
          <Link href={`/places?city=${city.slug}`} className="text-sm text-brand">
            {labels.exploreCityPlaces}
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
                categoryLabel={locale === "tr" ? place.category.nameTr : place.category.nameDe}
                cityLabel={locale === "tr" ? place.city.nameTr : place.city.nameDe}
                returnPath={`/${locale}/cities/${city.slug}`}
                isAuthenticated={isAuthenticated}
                labels={{
                  details: labels.cardDetails,
                  save: labels.cardSave,
                  saved: labels.cardSaved,
                  saving: labels.cardSaving,
                  signIn: labels.cardSignIn,
                  verified: labels.cardVerified,
                  claimed: labels.cardClaimed,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">{labels.featuredEvents}</h2>
          <Link href={`/events?city=${city.slug}`} className="text-sm text-brand">
            {labels.exploreCityEvents}
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
                returnPath={`/${locale}/cities/${city.slug}`}
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
