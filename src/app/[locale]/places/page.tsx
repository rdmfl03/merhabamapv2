import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { PlaceCard } from "@/components/places/place-card";
import { PlacesFilters } from "@/components/places/places-filters";
import { PlacesSavedFilterShell } from "@/components/places/places-saved-filter-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import {
  isListingAllCities,
  isListingCitySelected,
  isSpecificListingCity,
  LISTING_ALL_CITIES_SLUG,
} from "@/lib/listing-city-filter";
import { buildPlacesListingMetadata } from "@/lib/metadata/places";
import {
  buildPlacesNavPath,
  buildPlacesPath,
  getLocalizedPlaceCategoryLabel,
  getLocalizedText,
} from "@/lib/places";
import { parsePlacesFiltersFromSearchParams } from "@/lib/validators/places";
import { getCategoryIdsEligibleForBrowse } from "@/server/queries/categories/category-browse-eligibility";
import { getPlaceFilters } from "@/server/queries/places/get-place-filters";
import {
  listPlaces,
  PLACES_LIST_PAGE_SIZE,
  type ListPlacesResult,
} from "@/server/queries/places/list-places";

type PlacesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: PlacesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "places" });
  const filters = parsePlacesFiltersFromSearchParams(rawSearchParams);
  let cityLabel: string | null = null;
  let categoryLabel: string | null = null;

  try {
    const filterData = await getPlaceFilters({
      categoryCitySlug: isSpecificListingCity(filters.city) ? filters.city : undefined,
    });
    const city = filterData.cities.find((entry) => entry.slug === filters.city);
    const catSlugs = filters.categories ?? [];
    const category =
      catSlugs.length === 1
        ? filterData.categories.find((entry) => entry.slug === catSlugs[0])
        : undefined;

    cityLabel = city ? (getLocalizedCityDisplayName(locale, city)) : null;
    categoryLabel = category
      ? getLocalizedPlaceCategoryLabel(category, locale)
      : null;
  } catch {
    cityLabel = null;
    categoryLabel = null;
  }
  const title = cityLabel
    ? t("metaTitleCity", { city: cityLabel })
    : isListingAllCities(filters.city)
      ? t("metaTitleAllCities")
      : categoryLabel
        ? t("metaTitleCategory", { category: categoryLabel })
        : t("metaTitle");
  const description = cityLabel
    ? t("metaDescriptionCity", { city: cityLabel })
    : isListingAllCities(filters.city)
      ? t("metaDescriptionAllCities")
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
  const filters = parsePlacesFiltersFromSearchParams(rawSearchParams);

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
  const emptyListResult: ListPlacesResult = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: PLACES_LIST_PAGE_SIZE,
    pageCount: 1,
  };
  let listResult: ListPlacesResult = emptyListResult;

  try {
    filterData = await getPlaceFilters({
      categoryCitySlug: isSpecificListingCity(filters.city) ? filters.city : undefined,
    });
  } catch {
    filterData = {
      cities: [],
      categories: [],
    };
  }

  try {
    if (isListingCitySelected(filters.city)) {
      listResult = await listPlaces({
        filters,
        userId: session?.user?.id,
      });
    }
  } catch {
    listResult = emptyListResult;
  }

  const places = listResult.items;

  const browseEligibleCategoryIds =
    places.length > 0
      ? await getCategoryIdsEligibleForBrowse([...new Set(places.map((p) => p.category.id))])
      : new Set<string>();

  const imageAttributionLabels = {
    license: t("imageAttribution.license"),
    sourceLink: t("imageAttribution.sourceLink"),
    rightsLink: t("imageAttribution.rightsLink"),
    provider: t("imageAttribution.provider"),
    requiredNotice: t("imageAttribution.requiredNotice"),
  };

  const currentPath = buildPlacesPath(locale, filters);
  const city = filterData.cities.find((entry) => entry.slug === filters.city);
  const listingCityReady = isListingCitySelected(filters.city);
  const scopeAllCities = isListingAllCities(filters.city);
  type PlaceFilterCategory = (typeof filterData.categories)[number];
  const selectedCategories = (filters.categories ?? [])
    .map((slug) => filterData.categories.find((entry) => entry.slug === slug))
    .filter((entry): entry is PlaceFilterCategory => entry != null);
  const activeFilterItems = [
    scopeAllCities
      ? { key: "city", label: `${t("filters.city")}: ${t("filters.allCities")}` }
      : city
        ? { key: "city", label: `${t("filters.city")}: ${getLocalizedCityDisplayName(locale, city)}` }
        : null,
    selectedCategories.length > 0
      ? {
          key: "category",
          label: `${t("filters.category")}: ${selectedCategories
            .map((c) => getLocalizedPlaceCategoryLabel(c, locale))
            .join(", ")}`,
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
  const hasNarrowResults =
    hasActiveFilters && listResult.totalCount > 0 && listResult.totalCount <= 3;
  const activeSortLabel =
    filters.sort && filters.sort !== "recommended" ? t("filters.newest") : null;
  const emptyBrowseShortcut = city
    ? {
        href: `/places?city=${city.slug}`,
        label: t("empty.browseCity", {
          city: getLocalizedCityDisplayName(locale, city),
        }),
      }
    : {
        href: `/places?city=${LISTING_ALL_CITIES_SLUG}`,
        label: t("empty.browseAll"),
      };
  const nearEmptyShortcut = city
    ? {
        href: `/places?city=${city.slug}`,
        label: t("narrowResultsAction", {
          city: getLocalizedCityDisplayName(locale, city),
        }),
      }
    : null;
  const rangeFrom =
    listResult.totalCount === 0 ? 0 : (listResult.page - 1) * listResult.pageSize + 1;
  const rangeTo = Math.min(
    listResult.page * listResult.pageSize,
    listResult.totalCount,
  );

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
                city: getLocalizedCityDisplayName(locale, city),
              })}
            </p>
          ) : null}
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {city
              ? t("titleCity", {
                  city: getLocalizedCityDisplayName(locale, city),
                })
              : scopeAllCities
                ? t("titleAllCities")
                : t("title")}
          </h1>
          <p className="max-w-3xl text-base leading-6 text-muted-foreground">
            {city
              ? t("descriptionCity", {
                  city: getLocalizedCityDisplayName(locale, city),
                })
              : scopeAllCities
                ? t("descriptionAllCities")
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
          label: getLocalizedCityDisplayName(locale, city),
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
          pickCityFirst: t("filters.pickCityFirst"),
          allCities: t("filters.allCities"),
          allCategories: t("filters.allCategories"),
          categoriesFilterLabel: t("filters.categoriesFilterLabel"),
          categoriesFilterHint: t("filters.categoriesFilterHint"),
          categoriesDropdownAll: t("filters.categoriesDropdownAll"),
          categoriesDropdownMultiple: t("filters.categoriesDropdownMultiple"),
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
        isAuthenticated={Boolean(session?.user?.id)}
        imageAttributionLabels={imageAttributionLabels}
        labels={{
          toggle: t("savedFilter.toggle"),
          activeHint: t("savedFilter.activeHint"),
          panelTitle: t("savedFilter.panelTitle"),
          emptyTitle: t("savedFilter.emptyTitle"),
          emptyDescription: t("savedFilter.emptyDescription"),
          showAll: t("savedFilter.showAll"),
          details: t("card.details"),
          save: t("card.save"),
          saved: t("card.saved"),
          saving: t("card.saving"),
          signIn: t("card.signIn"),
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

          {!listingCityReady ? (
            <Card className="bg-white/90">
              <CardContent className="space-y-4 p-8 text-center">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl text-foreground">{t("pickCity.title")}</h2>
                  <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
                    {t("pickCity.description")}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/places?city=${LISTING_ALL_CITIES_SLUG}`}>{t("pickCity.showAllCities")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : listResult.totalCount === 0 ? (
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
                    ? t("pagination.showingRangeCity", {
                        from: rangeFrom,
                        to: rangeTo,
                        total: listResult.totalCount,
                        city: getLocalizedCityDisplayName(locale, city),
                      })
                    : t("pagination.showingRange", {
                        from: rangeFrom,
                        to: rangeTo,
                        total: listResult.totalCount,
                      })}
                  {listResult.pageCount > 1 ? (
                    <span className="ml-1">
                      {" · "}
                      {t("pagination.pageStatus", {
                        page: listResult.page,
                        pageCount: listResult.pageCount,
                      })}
                    </span>
                  ) : null}
                  {activeSortLabel ? (
                    <span>{` · ${t("resultsSort", { sort: activeSortLabel })}`}</span>
                  ) : null}
                </p>
              </div>
              {hasNarrowResults ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-white/90 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>{t("narrowResults", { count: listResult.totalCount })}</p>
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
                    categoryHref={
                      browseEligibleCategoryIds.has(place.category.id)
                        ? `/categories/${encodeURIComponent(place.category.slug)}`
                        : undefined
                    }
                    cityLabel={getLocalizedCityDisplayName(locale, place.city)}
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
                    imageAttributionLabels={imageAttributionLabels}
                  />
                ))}
              </div>
              {listResult.pageCount > 1 ? (
                <nav
                  className="flex flex-col items-stretch gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
                  aria-label={locale === "tr" ? "Sayfalama" : "Paginierung"}
                >
                  <div className="flex flex-wrap gap-2">
                    {listResult.page > 1 ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={buildPlacesNavPath(locale, {
                            ...filters,
                            page: listResult.page - 1,
                          })}
                        >
                          {t("pagination.previous")}
                        </Link>
                      </Button>
                    ) : null}
                    {listResult.page < listResult.pageCount ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={buildPlacesNavPath(locale, {
                            ...filters,
                            page: listResult.page + 1,
                          })}
                        >
                          {t("pagination.next")}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
                    {Array.from({ length: listResult.pageCount }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === listResult.page ? "default" : "outline"}
                        size="sm"
                        className="min-w-9 px-2"
                        asChild
                      >
                        <Link
                          href={buildPlacesNavPath(locale, {
                            ...filters,
                            page: p > 1 ? p : undefined,
                          })}
                        >
                          {p}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </nav>
              ) : null}
            </section>
          )}
        </>
      </PlacesSavedFilterShell>
    </div>
  );
}
