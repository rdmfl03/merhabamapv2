import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CityDiscoveryOverview } from "@/components/cities/city-discovery-overview";
import { JsonLd } from "@/components/seo/json-ld";
import { buildCityMetadata } from "@/lib/metadata/public";
import { buildCityCollectionSchema } from "@/lib/seo/structured-data";
import { getPublicCityPage } from "@/server/queries/cities/get-public-city-page";
import { getPilotCities } from "@/server/queries/cities/get-pilot-cities";

type CityPageProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export async function generateStaticParams() {
  const cities = await getPilotCities();

  return cities.flatMap((city) => [
    { locale: "de", slug: city.slug },
    { locale: "tr", slug: city.slug },
  ]);
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const cityPage = await getPublicCityPage(slug);

  if (!cityPage) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "cities" });
  const cityName = locale === "tr" ? cityPage.city.nameTr : cityPage.city.nameDe;
  const title = t("metaTitle", { city: cityName });
  const description = t("metaDescription", { city: cityName });

  return buildCityMetadata({
    locale,
    citySlug: slug,
    title,
    description,
  });
}

export default async function CityPage({ params }: CityPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const [t, cityPage, placesTexts, eventsTexts] = await Promise.all([
    getTranslations("cities"),
    getPublicCityPage(slug, session?.user?.id),
    getTranslations("places"),
    getTranslations("events"),
  ]);

  if (!cityPage) {
    notFound();
  }

  const cityName = locale === "tr" ? cityPage.city.nameTr : cityPage.city.nameDe;
  const description = t("metaDescription", { city: cityName });

  return (
    <>
      <JsonLd
        data={buildCityCollectionSchema({
          locale,
          cityName,
          description,
          path: `/cities/${slug}`,
        })}
      />
      <CityDiscoveryOverview
        locale={locale}
        city={{
          slug: cityPage.city.slug,
          name: cityName,
          isPilot: cityPage.city.isPilot,
        }}
        placeCount={cityPage.placeCount}
        eventCount={cityPage.eventCount}
        featuredPlaces={cityPage.featuredPlaces}
        upcomingEvents={cityPage.upcomingEvents}
        isAuthenticated={Boolean(session?.user?.id)}
        labels={{
          eyebrow: t("eyebrow"),
          title: t("title", { city: cityName }),
          description: t("description", { city: cityName }),
          statsPlaces: t("stats.places"),
          statsEvents: t("stats.events"),
          statsPilot: t("stats.status"),
          statsPilotValue: t("stats.statusValue"),
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
          cardClaimed: placesTexts("badges.claimed"),
          eventExternal: eventsTexts("card.external"),
          placeFallback: placesTexts("card.fallbackDescription"),
          eventFallback: eventsTexts("card.fallbackDescription"),
          exploreCityPlaces: t("sections.viewAllPlaces"),
          exploreCityEvents: t("sections.viewAllEvents"),
          eventCategoryLabels: Object.fromEntries(
            ["concert", "culture", "student", "community", "family", "business", "religious"].map(
              (key) => [key, eventsTexts(`categories.${key}`)],
            ),
          ),
        }}
      />
    </>
  );
}
