import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { PlaceCard } from "@/components/places/place-card";
import { PlacesFilters } from "@/components/places/places-filters";
import { PlacesSavedFilterShell } from "@/components/places/places-saved-filter-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { buildPlacesListingMetadata } from "@/lib/metadata/places";
import {
  buildPlacesPath,
  computeCategoryAdjustedScore,
  computePlaceScore,
  computeRatingConfidence,
  getCategoryKey,
  getPlaceDisplayRatingSummary,
  getPlaceScoreRatingCount,
  getTopPlaces,
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

type PlacePageItem = Awaited<ReturnType<typeof listPlaces>>[number];
type PlacePageTrendingItem = PlacePageItem & {
  createdAt?: Date | null;
};

export const dynamic = "force-dynamic";

function getTopPlacesByCategoryLocal(
  places: readonly PlacePageItem[],
  category: string,
  limit = 5,
) {
  return [...places]
    .filter((place) => getCategoryKey(place) === category)
    .filter((place) => {
      const summary = getPlaceDisplayRatingSummary(place);
      if (!summary || summary.count < 5) {
        return false;
      }

      return computeRatingConfidence(place).level !== "low";
    })
    .sort(
      (left, right) =>
        computeCategoryAdjustedScore(right) - computeCategoryAdjustedScore(left),
    )
    .slice(0, limit);
}

function getTrendingPlacesLocal(
  places: readonly PlacePageTrendingItem[],
  options?: { limit?: number; maxAgeDays?: number; minRatingCount?: number; now?: Date },
) {
  const limit = options?.limit ?? 5;
  const maxAgeDays = options?.maxAgeDays ?? 90;
  const minRatingCount = options?.minRatingCount ?? 3;
  const now = options?.now ?? new Date();

  return [...places]
    .filter((place) => {
      if (!(place.createdAt instanceof Date) || Number.isNaN(place.createdAt.getTime())) {
        return false;
      }

      const ageDays = (now.getTime() - place.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 0 || ageDays > maxAgeDays) {
        return false;
      }

      return getPlaceScoreRatingCount(place) >= minRatingCount;
    })
    .sort((left, right) => {
      const leftAgeDays = (now.getTime() - left.createdAt!.getTime()) / (1000 * 60 * 60 * 24);
      const rightAgeDays = (now.getTime() - right.createdAt!.getTime()) / (1000 * 60 * 60 * 24);
      const leftFreshnessBoost = Math.max(0, 1 - leftAgeDays / maxAgeDays);
      const rightFreshnessBoost = Math.max(0, 1 - rightAgeDays / maxAgeDays);
      const leftTrendingScore = computePlaceScore(left) * 0.7 + leftFreshnessBoost * 0.3;
      const rightTrendingScore =
        computePlaceScore(right) * 0.7 + rightFreshnessBoost * 0.3;

      if (rightTrendingScore !== leftTrendingScore) {
        return rightTrendingScore - leftTrendingScore;
      }

      return leftAgeDays - rightAgeDays;
    })
    .slice(0, limit);
}

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
  let cityLabel: string | null = null;
  let categoryLabel: string | null = null;

  try {
    const filterData = await getPlaceFilters();
    const city = filterData.cities.find((entry) => entry.slug === filters.city);
    const category = filterData.categories.find(
      (entry) => entry.slug === filters.category,
    );

    cityLabel = city ? (locale === "tr" ? city.nameTr : city.nameDe) : null;
    categoryLabel = category
      ? getLocalizedPlaceCategoryLabel(category, locale)
      : null;
  } catch {
    cityLabel = null;
    categoryLabel = null;
  }
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

  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  const t = await getTranslations("places");
  let filterData: Awaited<ReturnType<typeof getPlaceFilters>> = {
    cities: [],
    categories: [],
  };
  let places: Awaited<ReturnType<typeof listPlaces>> = [];

  try {
    filterData = await getPlaceFilters();
  } catch {
    filterData = {
      cities: [],
      categories: [],
    };
  }

  try {
    places = await listPlaces({
      filters,
      userId: session?.user?.id,
    });
  } catch {
    places = [];
  }

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
  const topPlaces = getTopPlaces(places);
  const usedPlaceIds = new Set(topPlaces.map((place) => place.id));
  const trendingPlaces = getTrendingPlacesLocal(places as PlacePageTrendingItem[], {
    limit: 3,
  }).filter((place) => {
    if (usedPlaceIds.has(place.id)) {
      return false;
    }

    usedPlaceIds.add(place.id);
    return true;
  });
  const categorySections = [
    {
      key: "restaurants",
      title: "Top Restaurants",
      places: getTopPlacesByCategoryLocal(places, "restaurant", 3),
    },
    {
      key: "mosques",
      title: "Top Moscheen",
      places: getTopPlacesByCategoryLocal(places, "mosque", 3),
    },
    {
      key: "cafes",
      title: "Top Cafés",
      places: getTopPlacesByCategoryLocal(places, "cafe", 3),
    },
  ]
    .map((section) => ({
      ...section,
      places: section.places.filter((place) => {
        if (usedPlaceIds.has(place.id)) {
          return false;
        }

        usedPlaceIds.add(place.id);
        return true;
      }),
    }))
    .filter((section) => section.places.length > 0);

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
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/submit/place">{t("submitCta")}</Link>
            </Button>
          </div>
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

      <PlacesSavedFilterShell
        locale={locale}
        places={places}
        currentPath={currentPath}
        labels={{
          toggle: locale === "tr" ? "Kaydedilenler" : "Gespeichert",
          activeHint:
            locale === "tr"
              ? "Yalnizca kaydedilen yerler gosteriliyor"
              : "Nur gespeicherte Orte werden angezeigt",
          panelTitle:
            locale === "tr"
              ? "Kaydettigin yerler"
              : "Deine gespeicherten Orte",
          results:
            locale === "tr"
              ? "{count} kaydedilen yer"
              : "{count} gespeicherte Orte",
          emptyTitle:
            locale === "tr"
              ? "Henuz kaydedilen bir yer yok."
              : "Du hast noch keine Orte gespeichert.",
          emptyDescription:
            locale === "tr"
              ? "Daha sonra tekrar bulmak icin yerleri kaydet."
              : "Speichere Orte, um sie hier wiederzufinden.",
          showAll: locale === "tr" ? "Tum yerleri goster" : "Alle Orte anzeigen",
          details: t("card.details"),
          save: t("card.save"),
          saved: t("card.saved"),
          verified: t("badges.verified"),
          fallbackDescription: t("card.fallbackDescription"),
        }}
      >
        <>
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

          {topPlaces.length > 0 ? (
            <section className="space-y-4 py-1">
              <div className="space-y-1">
                <h2 className="font-display text-3xl text-foreground">Top Orte</h2>
                <p className="text-sm text-muted-foreground">
                  Die besten Orte auf einen Blick
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {topPlaces.map((place) => (
                  <PlaceCard
                    key={`top-${place.id}`}
                    place={place}
                    locale={locale}
                    description={getLocalizedText(
                      { de: place.descriptionDe, tr: place.descriptionTr },
                      locale,
                      t("card.fallbackDescription"),
                    )}
                    categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
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
          ) : null}

          {trendingPlaces.length > 0 ? (
            <section className="space-y-3 pt-1">
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-foreground">Neu & im Kommen</h2>
                <p className="text-sm text-muted-foreground">
                  Neue Orte mit viel Potenzial
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {trendingPlaces.map((place) => (
                  <PlaceCard
                    key={`trending-${place.id}`}
                    place={place}
                    locale={locale}
                    description={getLocalizedText(
                      { de: place.descriptionDe, tr: place.descriptionTr },
                      locale,
                      t("card.fallbackDescription"),
                    )}
                    categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
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
          ) : null}

          {categorySections.map((section) => (
            <section key={section.key} className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground/90">{section.title}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.places.map((place) => (
                  <PlaceCard
                    key={`${section.key}-${place.id}`}
                    place={place}
                    locale={locale}
                    description={getLocalizedText(
                      { de: place.descriptionDe, tr: place.descriptionTr },
                      locale,
                      t("card.fallbackDescription"),
                    )}
                    categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
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
          ))}

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
        </>
      </PlacesSavedFilterShell>
    </div>
  );
}
