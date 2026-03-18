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
    sort: typeof rawSearchParams.sort === "string" ? rawSearchParams.sort : undefined,
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
    sort: typeof rawSearchParams.sort === "string" ? rawSearchParams.sort : undefined,
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
  const city = filterData.cities.find((entry) => entry.slug === filters.city);
  const category = filterData.categories.find(
    (entry) => entry.slug === filters.category,
  );
  const activeFilterItems = [
    city ? { key: "city", label: `${t("filters.city")}: ${locale === "tr" ? city.nameTr : city.nameDe}` } : null,
    category
      ? {
          key: "category",
          label: `${t("filters.category")}: ${getLocalizedPlaceCategoryLabel(category, locale)}`,
        }
      : null,
    filters.sort && filters.sort !== "recommended"
      ? {
          key: "sort",
          label: `${t("activeFilters.sort")}: ${filters.sort === "newest" ? t("filters.newest") : t("filters.recommended")}`,
        }
      : null,
    filters.q
      ? {
          key: "search",
          label: `${t("activeFilters.search")}: "${filters.q}"`,
        }
      : null,
  ].filter((item): item is { key: string; label: string } => Boolean(item));
  const hasActiveFilters = activeFilterItems.length > 0;
  const hasNarrowResults = hasActiveFilters && places.length > 0 && places.length <= 3;
  const activeSortLabel =
    filters.sort && filters.sort !== "recommended" ? t("filters.newest") : null;
  const emptyBrowseShortcut = city
    ? {
        href: `/places?city=${city.slug}`,
        label: t("empty.browseCity", {
          city: locale === "tr" ? city.nameTr : city.nameDe,
        }),
      }
    : {
        href: "/places",
        label: t("empty.browseAll"),
      };
  const nearEmptyShortcut = city
    ? {
        href: `/places?city=${city.slug}`,
        label: t("narrowResultsAction", {
          city: locale === "tr" ? city.nameTr : city.nameDe,
        }),
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:py-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          {t("eyebrow")}
        </p>
        <div className="space-y-2">
          {city ? (
            <p className="text-sm font-medium text-brand/80">
              {t("cityContext", {
                city: locale === "tr" ? city.nameTr : city.nameDe,
              })}
            </p>
          ) : null}
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {city
              ? t("titleCity", {
                  city: locale === "tr" ? city.nameTr : city.nameDe,
                })
              : t("title")}
          </h1>
          <p className="max-w-3xl text-base leading-6 text-muted-foreground">
            {city
              ? t("descriptionCity", {
                  city: locale === "tr" ? city.nameTr : city.nameDe,
                })
              : t("description")}
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
          sort: t("filters.sort"),
          allCities: t("filters.allCities"),
          allCategories: t("filters.allCategories"),
          recommended: t("filters.recommended"),
          newest: t("filters.newest"),
          apply: t("filters.apply"),
          reset: t("filters.reset"),
        }}
      />

      {hasActiveFilters ? (
        <section className="flex flex-wrap items-center gap-2 rounded-[1.3rem] border border-border bg-white/90 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">{t("activeFilters.label")}</span>
          {activeFilterItems.map((item) => (
            <span
              key={item.key}
              className="rounded-full border border-border/80 bg-[#f5f6f8] px-3 py-1 text-muted-foreground"
            >
              {item.label}
            </span>
          ))}
          <Link
            href="/places"
            className="ml-auto text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            {t("activeFilters.clearAll")}
          </Link>
        </section>
      ) : null}

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
            {hasActiveFilters ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-border/80 bg-[#f5f6f8] px-4 py-3 text-left text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("empty.tryNextLabel")}</p>
                <ul className="mt-2 space-y-1.5">
                  <li>{t("empty.tryBroaderSearch")}</li>
                  <li>{t("empty.tryAnotherCity")}</li>
                  <li>{t("empty.tryClearFilters")}</li>
                </ul>
              </div>
            ) : null}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="outline" asChild>
                <Link href="/places">{t("empty.reset")}</Link>
              </Button>
              <Button asChild>
                <Link href={emptyBrowseShortcut.href}>{emptyBrowseShortcut.label}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {city
                ? t("resultsCountCity", {
                    count: places.length,
                    city: locale === "tr" ? city.nameTr : city.nameDe,
                  })
                : t("resultsCount", { count: places.length })}
              {activeSortLabel ? (
                <span>{` · ${t("resultsSort", { sort: activeSortLabel })}`}</span>
              ) : null}
            </p>
          </div>
          {hasNarrowResults ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-white/90 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>{t("narrowResults", { count: places.length })}</p>
              {nearEmptyShortcut ? (
                <Link
                  href={nearEmptyShortcut.href}
                  className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                >
                  {nearEmptyShortcut.label}
                </Link>
              ) : null}
            </div>
          ) : null}
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
