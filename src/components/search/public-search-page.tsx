import { getTranslations } from "next-intl/server";

import { GuestConversionHint } from "@/components/account/guest-conversion-hint";
import { EventCard } from "@/components/events/event-card";
import { PlaceCard } from "@/components/places/place-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildPublicSearchPath } from "@/lib/search/public-search-path";
import {
  getEventCategoryLabelKey,
  getLocalizedEventText,
} from "@/lib/events";
import {
  getLocalizedPlaceCategoryLabel,
  getLocalizedText,
} from "@/lib/places";
import { getCategoryIdsEligibleForBrowse } from "@/server/queries/categories/category-browse-eligibility";
import type { PublicSearchResult } from "@/server/queries/search/search-public-entities";

type SearchCityOption = { slug: string; nameDe: string; nameTr: string };

type PublicSearchPageProps = {
  locale: AppLocale;
  initialQ: string;
  initialCity: string | undefined;
  cities: SearchCityOption[];
  result: PublicSearchResult | null;
  returnPath: string;
  isAuthenticated: boolean;
};

export async function PublicSearchPage({
  locale,
  initialQ,
  initialCity,
  cities,
  result,
  returnPath,
  isAuthenticated,
}: PublicSearchPageProps) {
  const [t, tSaved, tEvents, tPlaces] = await Promise.all([
    getTranslations("search"),
    getTranslations("saved"),
    getTranslations("events"),
    getTranslations("places"),
  ]);

  const browseEligibleCategoryIds =
    result && result.places.length > 0
      ? await getCategoryIdsEligibleForBrowse([...new Set(result.places.map((p) => p.category.id))])
      : [];

  const hasQuery = initialQ.trim().length >= 2;
  const showResults = hasQuery && result != null;
  const empty =
    showResults && result.places.length === 0 && result.events.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("eyebrow")}</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <form
        method="get"
        action={buildPublicSearchPath(locale, {})}
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
        role="search"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="search-q" className="text-xs font-medium text-muted-foreground">
            {t("form.queryLabel")}
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={initialQ}
            placeholder={t("form.queryPlaceholder")}
            autoComplete="off"
            className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="w-full min-w-[12rem] space-y-1.5 sm:w-52">
          <label htmlFor="search-city" className="text-xs font-medium text-muted-foreground">
            {t("form.cityLabel")}
          </label>
          <select
            id="search-city"
            name="city"
            defaultValue={initialCity ?? ""}
            className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t("form.cityAll")}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {getLocalizedCityDisplayName(locale, c)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-10 w-full sm:w-auto">
          {t("form.submit")}
        </Button>
      </form>

      {hasQuery && result ? (
        <p className="text-sm text-muted-foreground">
          {t("resultsFor", { query: result.normalizedQuery })}
        </p>
      ) : initialQ.trim().length > 0 && initialQ.trim().length < 2 ? (
        <p className="text-sm text-muted-foreground">{t("queryTooShort")}</p>
      ) : null}

      {empty ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.message")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Button variant="outline" size="sm" asChild>
              <Link href="/map">{t("empty.ctaMap")}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/feed">{t("empty.ctaFeed")}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/categories">{t("empty.ctaCategories")}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {showResults && !empty ? (
        <div className="space-y-10">
          <section className="space-y-4" aria-labelledby="search-places">
            <h2 id="search-places" className="font-display text-xl text-foreground md:text-2xl">
              {t("sectionPlaces")}
            </h2>
            {result.places.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("nonePlaces")}</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {result.places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    locale={locale}
                    description={getLocalizedText(
                      { de: place.descriptionDe, tr: place.descriptionTr },
                      locale,
                      tPlaces("card.fallbackDescription"),
                    )}
                    categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                    categoryHref={
                      browseEligibleCategoryIds.includes(place.category.id)
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

          <section className="space-y-4" aria-labelledby="search-events">
            <h2 id="search-events" className="font-display text-xl text-foreground md:text-2xl">
              {t("sectionEvents")}
            </h2>
            {result.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noneEvents")}</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {result.events.map((event) => (
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
        </div>
      ) : null}

      {!isAuthenticated && hasQuery ? (
        <GuestConversionHint locale={locale} returnPath={returnPath} />
      ) : null}
    </div>
  );
}
