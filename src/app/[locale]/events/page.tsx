import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { EventCard } from "@/components/events/event-card";
import { EventsFilters } from "@/components/events/events-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  buildEventsPath,
  getEventCategoryLabelKey,
  getLocalizedEventText,
} from "@/lib/events";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildEventsListingMetadata } from "@/lib/metadata/events";
import { parseEventsFiltersFromSearchParams } from "@/lib/validators/events";
import { getEventFilters } from "@/server/queries/events/get-event-filters";
import { listEvents } from "@/server/queries/events/list-events";

type EventsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "events" });
  const filters = parseEventsFiltersFromSearchParams(rawSearchParams);
  let cityLabel: string | null = null;

  try {
    const filterData = await getEventFilters();
    const city = filterData.cities.find((entry) => entry.slug === filters.city);
    cityLabel = city ? (getLocalizedCityDisplayName(locale, city)) : null;
  } catch {
    cityLabel = null;
  }
  const categoryLabel = filters.category
    ? t(`categories.${getEventCategoryLabelKey(filters.category)}`)
    : null;
  const title = cityLabel
    ? t("metaTitleCity", { city: cityLabel })
    : categoryLabel
      ? t("metaTitleCategory", { category: categoryLabel })
      : t("metaTitle");
  const description = cityLabel
    ? t("metaDescriptionCity", { city: cityLabel })
    : t("metaDescription");

  return buildEventsListingMetadata({
    locale,
    title,
    description,
    path: buildEventsPath(locale, filters).replace(`/${locale}`, ""),
  });
}

export default async function EventsPage({
  params,
  searchParams,
}: EventsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const filters = parseEventsFiltersFromSearchParams(rawSearchParams);

  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  const t = await getTranslations("events");
  let filterData: Awaited<ReturnType<typeof getEventFilters>> = {
    cities: [],
    categories: [],
  };
  let events: Awaited<ReturnType<typeof listEvents>> = [];

  try {
    filterData = await getEventFilters();
  } catch {
    filterData = {
      cities: [],
      categories: [],
    };
  }

  try {
    events = await listEvents({
      filters,
      userId: session?.user?.id,
    });
  } catch {
    events = [];
  }

  const currentPath = buildEventsPath(locale, filters);
  const city = filterData.cities.find((entry) => entry.slug === filters.city);
  const dateLabel =
    filters.date === "today"
      ? t("dateFilters.today")
      : filters.date === "this-week"
        ? t("dateFilters.thisWeek")
        : filters.date === "this-month"
          ? t("dateFilters.thisMonth")
          : filters.date === "upcoming"
            ? t("dateFilters.upcoming")
            : null;
  const activeFilterItems = [
    city ? { key: "city", label: `${t("filters.city")}: ${getLocalizedCityDisplayName(locale, city)}` } : null,
    filters.category
      ? {
          key: "category",
          label: `${t("filters.category")}: ${t(`categories.${getEventCategoryLabelKey(filters.category)}`)}`,
        }
      : null,
    filters.sort && filters.sort !== "soonest"
      ? {
          key: "sort",
          label: `${t("activeFilters.sort")}: ${filters.sort === "newest" ? t("filters.newest") : t("filters.soonest")}`,
        }
      : null,
    dateLabel
      ? {
          key: "date",
          label: `${t("activeFilters.date")}: ${dateLabel}`,
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
  const hasNarrowResults = hasActiveFilters && events.length > 0 && events.length <= 3;
  const activeSortLabel =
    filters.sort && filters.sort !== "soonest" ? t("filters.newest") : null;
  const emptyBrowseShortcut = city
    ? {
        href: `/events?city=${city.slug}`,
        label: t("empty.browseCity", {
          city: getLocalizedCityDisplayName(locale, city),
        }),
      }
    : {
        href: "/events",
        label: t("empty.browseAll"),
      };
  const nearEmptyShortcut = city
    ? {
        href: `/events?city=${city.slug}`,
        label: t("narrowResultsAction", {
          city: getLocalizedCityDisplayName(locale, city),
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
                city: getLocalizedCityDisplayName(locale, city),
              })}
            </p>
          ) : null}
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {city
              ? t("titleCity", {
                  city: getLocalizedCityDisplayName(locale, city),
                })
              : t("title")}
          </h1>
          <p className="max-w-3xl text-base leading-6 text-muted-foreground">
            {city
              ? t("descriptionCity", {
                  city: getLocalizedCityDisplayName(locale, city),
                })
              : t("description")}
          </p>
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/submit/event">{t("submitCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <EventsFilters
        locale={locale}
        values={filters}
        cities={filterData.cities.map((city) => ({
          value: city.slug,
          label: getLocalizedCityDisplayName(locale, city),
        }))}
        categories={filterData.categories.map((category) => ({
          value: category,
          label: t(`categories.${getEventCategoryLabelKey(category)}`),
        }))}
        dateOptions={[
          { value: "today", label: t("dateFilters.today") },
          { value: "this-week", label: t("dateFilters.thisWeek") },
          { value: "this-month", label: t("dateFilters.thisMonth") },
          { value: "upcoming", label: t("dateFilters.upcoming") },
        ]}
        labels={{
          searchPlaceholder: t("filters.searchPlaceholder"),
          allCities: t("filters.allCities"),
          allCategories: t("filters.allCategories"),
          allDates: t("filters.allDates"),
          sort: t("filters.sort"),
          soonest: t("filters.soonest"),
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
            href="/events"
            className="ml-auto text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            {t("activeFilters.clearAll")}
          </Link>
        </section>
      ) : null}

      {events.length === 0 ? (
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
                  <li>{t("empty.tryAnotherDate")}</li>
                </ul>
              </div>
            ) : null}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="outline" asChild>
                <Link href="/events">{t("empty.reset")}</Link>
              </Button>
              <Button asChild>
                <Link href={emptyBrowseShortcut.href}>{emptyBrowseShortcut.label}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {city
              ? t("resultsCountCity", {
                  count: events.length,
                  city: getLocalizedCityDisplayName(locale, city),
                })
              : t("resultsCount", { count: events.length })}
            {activeSortLabel ? (
              <span>{` · ${t("resultsSort", { sort: activeSortLabel })}`}</span>
            ) : null}
          </p>
          {hasNarrowResults ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-white/90 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>{t("narrowResults", { count: events.length })}</p>
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
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                description={getLocalizedEventText(
                  { de: event.descriptionDe, tr: event.descriptionTr },
                  locale,
                  t("card.fallbackDescription"),
                )}
                categoryLabel={t(`categories.${getEventCategoryLabelKey(event.category)}`)}
                cityLabel={getLocalizedCityDisplayName(locale, event.city)}
                returnPath={currentPath}
                isAuthenticated={Boolean(session?.user?.id)}
                labels={{
                  details: t("card.details"),
                  save: t("card.save"),
                  saved: t("card.saved"),
                  saving: t("card.saving"),
                  signIn: t("card.signIn"),
                  external: t("card.external"),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
