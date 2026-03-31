import { getTranslations } from "next-intl/server";

import { CityFollowPanel } from "@/components/cities/city-follow-panel";
import { EventCard } from "@/components/events/event-card";
import { FeedDiscoveryBlocks } from "@/components/feed/feed-discovery-blocks";
import { PlaceCard } from "@/components/places/place-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicShareButton } from "@/components/sharing/public-share-button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { buildCityCollectionSchema } from "@/lib/seo/structured-data";
import { buildLocalizedUrl } from "@/lib/seo/site";
import type { getCityBrowseData } from "@/server/queries/cities/get-city-browse-data";

type CityBrowsePayload = NonNullable<Awaited<ReturnType<typeof getCityBrowseData>>>;

type CityBrowsePageProps = {
  locale: AppLocale;
  data: CityBrowsePayload;
  returnPath: string;
  isAuthenticated: boolean;
  isFollowingCity: boolean;
};

export async function CityBrowsePage({
  locale,
  data,
  returnPath,
  isAuthenticated,
  isFollowingCity,
}: CityBrowsePageProps) {
  const [t, tSaved, tEvents, tCities] = await Promise.all([
    getTranslations("cities.browse"),
    getTranslations("saved"),
    getTranslations("events"),
    getTranslations("cities"),
  ]);

  const cityLabel = getLocalizedCityDisplayName(locale, data.city);
  const cityPathForSchema = `/cities/${data.city.slug}`;
  const mapHref = `/map?city=${encodeURIComponent(data.city.slug)}`;
  const placesListHref = `/places?city=${encodeURIComponent(data.city.slug)}`;
  const eventsListHref = `/events?city=${encodeURIComponent(data.city.slug)}`;

  const intro = t("intro", { city: cityLabel });

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-12">
      <JsonLd
        data={buildCityCollectionSchema({
          locale,
          cityName: cityLabel,
          description: t("metaDescription", { city: cityLabel }),
          path: cityPathForSchema,
        })}
      />

      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("eyebrow")}</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{cityLabel}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <p className="text-sm text-muted-foreground">
          {t("statsLine", {
            places: data.placeCount,
            events: data.eventCount,
          })}
        </p>
        <div className="max-w-md">
          <CityFollowPanel
            cityId={data.city.id}
            locale={locale}
            returnPath={returnPath}
            isFollowing={isFollowingCity}
            isAuthenticated={isAuthenticated}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
            labels={{
              follow: tCities("cityFollow.follow", { city: cityLabel }),
              unfollow: tCities("cityFollow.unfollow", { city: cityLabel }),
              signIn: tCities("cityFollow.signIn"),
              signUp: tCities("cityFollow.signUp"),
              signInHint: tCities("cityFollow.signInHint"),
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={mapHref}>{t("ctaMap")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={placesListHref}>{t("ctaPlaces")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={eventsListHref}>{t("ctaEvents")}</Link>
          </Button>
          <PublicShareButton
            locale={locale}
            insightSurface="city_browse"
            absoluteUrl={buildLocalizedUrl(locale, `/cities/${data.city.slug}`)}
            canonicalPath={`/${locale}/cities/${data.city.slug}`}
            title={t("metaTitle", { city: cityLabel })}
            text={t("metaDescription", { city: cityLabel })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/categories" className="font-medium text-brand underline-offset-2 hover:underline">
            {t("exploreByCategories")}
          </Link>
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="city-browse-places">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="city-browse-places" className="font-display text-xl text-foreground md:text-2xl">
            {t("placesTitle", { city: cityLabel })}
          </h2>
          <Link
            href={placesListHref}
            className="text-sm font-medium text-brand underline-offset-2 hover:underline"
          >
            {t("viewAllPlaces")}
          </Link>
        </div>
        {data.places.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("emptyPlaces")}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                locale={locale}
                description={getLocalizedText(
                  { de: place.descriptionDe, tr: place.descriptionTr },
                  locale,
                  tSaved("places.fallbackDescription"),
                )}
                categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                categoryHref={
                  data.eligibleCategoryIdsForBrowse.has(place.category.id)
                    ? `/categories/${encodeURIComponent(place.category.slug)}`
                    : undefined
                }
                cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                returnPath={returnPath}
                isAuthenticated={isAuthenticated}
                labels={{
                  details: tSaved("common.details"),
                  save: tSaved("common.save"),
                  saved: tSaved("common.saved"),
                  saving: tSaved("common.saving"),
                  signIn: tSaved("common.signIn"),
                  verified: tSaved("common.verified"),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="city-browse-events">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="city-browse-events" className="font-display text-xl text-foreground md:text-2xl">
            {t("eventsTitle", { city: cityLabel })}
          </h2>
          <Link
            href={eventsListHref}
            className="text-sm font-medium text-brand underline-offset-2 hover:underline"
          >
            {t("viewAllEvents")}
          </Link>
        </div>
        {data.events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("emptyEvents")}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                description={getLocalizedEventText(
                  { de: event.descriptionDe, tr: event.descriptionTr },
                  locale,
                  tEvents("detail.fallbackDescription"),
                )}
                categoryLabel={tEvents(`categories.${getEventCategoryLabelKey(event.category)}`)}
                cityLabel={getLocalizedCityDisplayName(locale, event.city)}
                returnPath={returnPath}
                isAuthenticated={isAuthenticated}
                labels={{
                  details: tSaved("common.details"),
                  save: tSaved("common.save"),
                  saved: tSaved("common.saved"),
                  saving: tSaved("common.saving"),
                  signIn: tSaved("common.signIn"),
                  external: tSaved("common.external"),
                }}
              />
            ))}
          </div>
        )}
      </section>

      {data.publicCollections.length > 0 ? (
        <section className="space-y-4" aria-labelledby="city-browse-collections">
          <h2 id="city-browse-collections" className="font-display text-xl text-foreground md:text-2xl">
            {t("collectionsTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("collectionsFootnote")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.publicCollections.map((c) => (
              <li key={c.id}>
                <Link href={`/collections/${c.id}`}>
                  <Card className="h-full bg-card/80 transition-colors hover:border-brand/25">
                    <CardContent className="space-y-1 p-4">
                      <p className="font-medium text-brand">{c.title}</p>
                      {c.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {t("collectionsItemCount", { n: c.itemCount })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <FeedDiscoveryBlocks locale={locale} discovery={data.discovery} />
    </div>
  );
}
