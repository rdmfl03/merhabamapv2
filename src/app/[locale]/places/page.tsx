import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { PlaceCard } from "@/components/places/place-card";
import { PlacesFilters } from "@/components/places/places-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { buildPlacesListingMetadata } from "@/lib/metadata/places";
import {
  buildPlacesPath,
  getLocalizedPlaceCategoryLabel,
  getLocalizedText,
} from "@/lib/places";
import { placesFilterSchema } from "@/lib/validators/places";
import { getPlaceFilters } from "@/server/queries/places/get-place-filters";
import { listPlaces } from "@/server/queries/places/list-places";

type PlacesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PlacesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "places" });
  const filters = placesFilterSchema.parse({
    city:
      typeof rawSearchParams.city === "string" ? rawSearchParams.city : undefined,
    category:
      typeof rawSearchParams.category === "string"
        ? rawSearchParams.category
        : undefined,
    q: typeof rawSearchParams.q === "string" ? rawSearchParams.q : undefined,
  });
  const filterData = await getPlaceFilters();
  const city = filterData.cities.find((entry) => entry.slug === filters.city);
  const category = filterData.categories.find(
    (entry) => entry.slug === filters.category,
  );
  const cityLabel = city ? (locale === "tr" ? city.nameTr : city.nameDe) : null;
  const categoryLabel = category
    ? getLocalizedPlaceCategoryLabel(category, locale)
    : null;
  const title = cityLabel
    ? t("metaTitleCity", { city: cityLabel })
    : categoryLabel
      ? t("metaTitleCategory", { category: categoryLabel })
      : t("metaTitle");
  const description = cityLabel
    ? t("metaDescriptionCity", { city: cityLabel })
    : t("metaDescription");

  return buildPlacesListingMetadata({
    locale,
    title,
    description,
    path: buildPlacesPath(locale, filters).replace(`/${locale}`, ""),
  });
}

export default async function PlacesPage({
  params,
  searchParams,
}: PlacesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const filters = placesFilterSchema.parse({
    city:
      typeof rawSearchParams.city === "string" ? rawSearchParams.city : undefined,
    category:
      typeof rawSearchParams.category === "string"
        ? rawSearchParams.category
        : undefined,
    q: typeof rawSearchParams.q === "string" ? rawSearchParams.q : undefined,
  });

  const session = await auth();
  const [t, filterData, places] = await Promise.all([
    getTranslations("places"),
    getPlaceFilters(),
    listPlaces({
      filters,
      userId: session?.user?.id,
    }),
  ]);

  const currentPath = buildPlacesPath(locale, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:py-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          {t("eyebrow")}
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-3xl text-base leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </section>

      <PlacesFilters
        locale={locale}
        values={filters}
        cities={filterData.cities.map((city) => ({
          slug: city.slug,
          label: locale === "tr" ? city.nameTr : city.nameDe,
        }))}
        categories={filterData.categories.map((category) => ({
          slug: category.slug,
          label: getLocalizedPlaceCategoryLabel(category, locale),
        }))}
        labels={{
          searchPlaceholder: t("filters.searchPlaceholder"),
          city: t("filters.city"),
          category: t("filters.category"),
          allCities: t("filters.allCities"),
          allCategories: t("filters.allCategories"),
          apply: t("filters.apply"),
          reset: t("filters.reset"),
        }}
      />

      {places.length === 0 ? (
        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-foreground">
                {t("empty.title")}
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/places">{t("empty.reset")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("resultsCount", { count: places.length })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                locale={locale}
                description={getLocalizedText(
                  { de: place.descriptionDe, tr: place.descriptionTr },
                  locale,
                  t("card.fallbackDescription"),
                )}
                categoryLabel={
                  getLocalizedPlaceCategoryLabel(place.category, locale)
                }
                cityLabel={locale === "tr" ? place.city.nameTr : place.city.nameDe}
                returnPath={currentPath}
                isAuthenticated={Boolean(session?.user?.id)}
                labels={{
                  details: t("card.details"),
                  save: t("card.save"),
                  saved: t("card.saved"),
                  saving: t("card.saving"),
                  signIn: t("card.signIn"),
                  verified: t("badges.verified"),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
