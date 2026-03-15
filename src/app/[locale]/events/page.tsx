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
import { buildEventsListingMetadata } from "@/lib/metadata/events";
import { eventsFilterSchema } from "@/lib/validators/events";
import { getEventFilters } from "@/server/queries/events/get-event-filters";
import { listEvents } from "@/server/queries/events/list-events";

type EventsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "events" });
  const parsedFilters = eventsFilterSchema.safeParse({
    city: typeof rawSearchParams.city === "string" ? rawSearchParams.city : undefined,
    category:
      typeof rawSearchParams.category === "string"
        ? rawSearchParams.category
        : undefined,
    date: typeof rawSearchParams.date === "string" ? rawSearchParams.date : undefined,
    q: typeof rawSearchParams.q === "string" ? rawSearchParams.q : undefined,
  });
  const filters = parsedFilters.success ? parsedFilters.data : {};
  const filterData = await getEventFilters();
  const city = filterData.cities.find((entry) => entry.slug === filters.city);
  const cityLabel = city ? (locale === "tr" ? city.nameTr : city.nameDe) : null;
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
  const parsedFilters = eventsFilterSchema.safeParse({
    city: typeof rawSearchParams.city === "string" ? rawSearchParams.city : undefined,
    category:
      typeof rawSearchParams.category === "string"
        ? rawSearchParams.category
        : undefined,
    date: typeof rawSearchParams.date === "string" ? rawSearchParams.date : undefined,
    q: typeof rawSearchParams.q === "string" ? rawSearchParams.q : undefined,
  });
  const filters = parsedFilters.success ? parsedFilters.data : {};

  const session = await auth();
  const [t, filterData, events] = await Promise.all([
    getTranslations("events"),
    getEventFilters(),
    listEvents({
      filters,
      userId: session?.user?.id,
    }),
  ]);

  const currentPath = buildEventsPath(locale, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-12">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          {t("eyebrow")}
        </p>
        <div className="space-y-3">
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </section>

      <EventsFilters
        locale={locale}
        values={filters}
        cities={filterData.cities.map((city) => ({
          value: city.slug,
          label: locale === "tr" ? city.nameTr : city.nameDe,
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
          apply: t("filters.apply"),
          reset: t("filters.reset"),
        }}
      />

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
            <Button variant="outline" asChild>
              <Link href="/events">{t("empty.reset")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("resultsCount", { count: events.length })}
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                cityLabel={locale === "tr" ? event.city.nameTr : event.city.nameDe}
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
