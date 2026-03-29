import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CityDiscoveryOverview } from "@/components/cities/city-discovery-overview";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import { buildCityMetadata } from "@/lib/metadata/public";
import { buildCityCollectionSchema } from "@/lib/seo/structured-data";
import { getDiscoveryMapCityOptions } from "@/server/queries/cities/get-discovery-map-cities";
import {
  getPublicCityPage,
  getPublicGermanyDiscoveryPage,
} from "@/server/queries/cities/get-public-city-page";

export const dynamic = "force-dynamic";

function normalizeCityQuery(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return normalizeCityQuery(raw[0]);
  }
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !/^[a-z0-9-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

type MapPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<{ city?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: MapPageProps): Promise<Metadata> {
  await connection();
  const { locale } = await params;
  const citySlug = normalizeCityQuery((await searchParams).city);

  const t = await getTranslations({ locale, namespace: "cities" });

  if (citySlug) {
    const cityPage = await getPublicCityPage(citySlug);
    if (!cityPage) {
      return {};
    }
    const cityName = getLocalizedCityDisplayName(locale, cityPage.city);
    return buildCityMetadata({
      locale,
      path: `/map?city=${citySlug}`,
      title: t("metaTitle", { city: cityName }),
      description: t("metaDescription", { city: cityName }),
    });
  }

  const country = t("countryLabel");
  return buildCityMetadata({
    locale,
    path: "/map",
    title: t("metaTitle", { city: country }),
    description: t("metaDescription", { city: country }),
  });
}

export default async function DiscoveryMapPage({ params, searchParams }: MapPageProps) {
  await connection();
  const { locale } = await params;
  setRequestLocale(locale);

  const citySlug = normalizeCityQuery((await searchParams).city);

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const userId = session?.user?.id;

  const [t, placesTexts, eventsTexts, pageData, mapCityOptions] = await Promise.all([
    getTranslations("cities"),
    getTranslations("places"),
    getTranslations("events"),
    citySlug
      ? getPublicCityPage(citySlug, userId)
      : getPublicGermanyDiscoveryPage(userId),
    getDiscoveryMapCityOptions(),
  ]);

  if (!pageData) {
    notFound();
  }

  const cityName = getLocalizedCityDisplayName(locale, pageData.city);
  const description = t("metaDescription", { city: cityName });
  const isNational = !citySlug;

  const placesListHref = isNational ? "/places" : `/places?city=${pageData.city.slug}`;
  const eventsListHref = isNational ? "/events" : `/events?city=${pageData.city.slug}`;
  const cardReturnPath = isNational
    ? `/${locale}/map`
    : `/${locale}/map?city=${pageData.city.slug}`;

  const collectionPath = isNational ? "/map" : `/map?city=${pageData.city.slug}`;

  const germanyMapClusters: GermanyMapCluster[] | null = isNational
    ? (pageData as unknown as { germanyMapClusters: GermanyMapCluster[] }).germanyMapClusters
    : null;

  return (
    <>
      <JsonLd
        data={buildCityCollectionSchema({
          locale,
          cityName,
          description,
          path: collectionPath,
        })}
      />
      <CityDiscoveryOverview
        locale={locale}
        city={{
          slug: pageData.city.slug,
          name: cityName,
          isPilot: pageData.city.isPilot,
          center: pageData.cityCenter,
        }}
        mapCityOptions={mapCityOptions}
        selectedMapCitySlug={citySlug ?? null}
        placesListHref={placesListHref}
        eventsListHref={eventsListHref}
        cardReturnPath={cardReturnPath}
        explorePlacesLinkLabel={
          isNational ? t("sections.viewAllPlacesNational") : t("sections.viewAllPlaces")
        }
        exploreEventsLinkLabel={
          isNational ? t("sections.viewAllEventsNational") : t("sections.viewAllEvents")
        }
        placeCount={pageData.placeCount}
        eventCount={pageData.eventCount}
        featuredPlaces={pageData.featuredPlaces}
        mapPlaces={pageData.mapPlaces}
        upcomingEvents={pageData.upcomingEvents}
        mapEvents={pageData.mapEvents}
        isAuthenticated={Boolean(userId)}
        germanyMapClusters={germanyMapClusters}
        labels={{
          eyebrow: t("eyebrow"),
          title: t("title", { city: cityName }),
          description: t("description", { city: cityName }),
          statsPlaces: t("stats.places"),
          statsEvents: t("stats.events"),
          mapTitle: t("map.title", { city: cityName }),
          mapDescription: t("map.description", { city: cityName }),
          mapEmpty: t("map.empty"),
          noResults: t("map.noResults"),
          noResultsInViewport: t("map.noResultsInViewport"),
          awaitingMapViewport: t("map.awaitingMapViewport"),
          cityPickerLabel: t("map.cityPickerLabel"),
          cityPickerAll: t("map.cityPickerAll"),
          searchPlaceholder: t("map.searchPlaceholder"),
          allResults: t("map.allResults"),
          placesOnly: t("map.placesOnly"),
          eventsOnly: t("map.eventsOnly"),
          allCategories: t("map.allCategories"),
          resetFilters: t("map.resetFilters"),
          resultsTitle: t("map.resultsTitle"),
          listRatingReviewsSuffix: t("map.listRatingReviewsSuffix"),
          resultsSummaryUnit: t("map.resultsSummaryUnit"),
          viewPlace: t("map.viewPlace"),
          popupPlaceRating: t("map.popupPlaceRating"),
          viewEvent: t("map.viewEvent"),
          locateMe: t("map.locateMe"),
          locating: t("map.locating"),
          locationUnavailable: t("map.locationUnavailable"),
          myLocation: t("map.myLocation"),
          legendPlaces: t("map.legendPlaces"),
          legendEvents: t("map.legendEvents"),
          placesCta: t("ctas.places", { city: cityName }),
          eventsCta: t("ctas.events", { city: cityName }),
          signUpCta: t("ctas.signUp"),
          featuredPlaces: t("sections.places"),
          featuredEvents: t("sections.events"),
          emptyPlaces: t("emptyPlaces"),
          emptyEvents: t("emptyEvents"),
          cardDetails: placesTexts("card.details"),
          cardSave: placesTexts("card.save"),
          cardSaved: placesTexts("card.saved"),
          cardSaving: placesTexts("card.saving"),
          cardSignIn: placesTexts("card.signIn"),
          cardVerified: placesTexts("badges.verified"),
          eventExternal: eventsTexts("card.external"),
          placeFallback: placesTexts("card.fallbackDescription"),
          eventFallback: eventsTexts("card.fallbackDescription"),
          eventCategoryLabels: Object.fromEntries(
            ["concert", "culture", "student", "community", "family", "business", "religious"].map(
              (key) => [key, eventsTexts(`categories.${key}`)],
            ),
          ),
          germanyClusterHint: t("map.germanyClusterHint"),
          germanyBackToOverview: t("map.germanyBackToOverview"),
          germanyClusterRevealLabel: t("map.germanyClusterReveal"),
          germanyLoadingCity: t("map.germanyLoadingCity"),
          resultsCitiesUnit: t("map.resultsCitiesUnit"),
        }}
      />
    </>
  );
}
