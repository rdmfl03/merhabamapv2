import { getTranslations } from "next-intl/server";

import { GuestConversionHint } from "@/components/account/guest-conversion-hint";
import { FeedDiscoveryBlocks } from "@/components/feed/feed-discovery-blocks";
import { PlaceCard } from "@/components/places/place-card";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicShareButton } from "@/components/sharing/public-share-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { buildCategoryCollectionSchema } from "@/lib/seo/structured-data";
import { buildLocalizedUrl } from "@/lib/seo/site";
import type { getCategoryBrowseData } from "@/server/queries/categories/get-category-browse-data";

type CategoryBrowsePayload = NonNullable<Awaited<ReturnType<typeof getCategoryBrowseData>>>;

type CategoryBrowsePageProps = {
  locale: AppLocale;
  data: CategoryBrowsePayload;
  returnPath: string;
  isAuthenticated: boolean;
};

export async function CategoryBrowsePage({
  locale,
  data,
  returnPath,
  isAuthenticated,
}: CategoryBrowsePageProps) {
  const [t, tSaved] = await Promise.all([
    getTranslations({ locale, namespace: "placeCategories" }),
    getTranslations("saved"),
  ]);

  const categoryLabel = getLocalizedPlaceCategoryLabel(data.category, locale);
  const pathForSchema = `/categories/${data.category.slug}`;
  const mapHref = `/map`;
  const placesListHref = `/places?categories=${encodeURIComponent(data.category.slug)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-12">
      <JsonLd
        data={buildCategoryCollectionSchema({
          locale,
          categoryName: categoryLabel,
          description: t("browse.metaDescription", { category: categoryLabel }),
          path: pathForSchema,
        })}
      />

      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("browse.eyebrow")}</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{categoryLabel}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("browse.intro", { category: categoryLabel })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("browse.statsLine", { places: data.placeCount })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={mapHref}>{t("browse.ctaMap")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={placesListHref}>{t("browse.ctaPlaces")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/categories">{t("browse.backToIndex")}</Link>
          </Button>
          <PublicShareButton
            locale={locale}
            insightSurface="category_browse"
            absoluteUrl={buildLocalizedUrl(locale, `/categories/${data.category.slug}`)}
            canonicalPath={`/${locale}/categories/${data.category.slug}`}
            title={t("browse.metaTitle", { category: categoryLabel })}
            text={t("browse.metaDescription", { category: categoryLabel })}
          />
        </div>
        {!isAuthenticated ? <GuestConversionHint locale={locale} returnPath={returnPath} /> : null}
      </header>

      <section className="space-y-4" aria-labelledby="category-browse-places">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="category-browse-places" className="font-display text-xl text-foreground md:text-2xl">
            {t("browse.placesTitle", { category: categoryLabel })}
          </h2>
          <Link
            href={placesListHref}
            className="text-sm font-medium text-brand underline-offset-2 hover:underline"
          >
            {t("browse.viewAllPlaces")}
          </Link>
        </div>
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
      </section>

      {data.cityHints.length > 0 ? (
        <section className="space-y-3" aria-labelledby="category-browse-cities">
          <h2 id="category-browse-cities" className="font-display text-xl text-foreground md:text-2xl">
            {t("browse.citiesTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("browse.citiesFootnote")}</p>
          <ul className="flex flex-wrap gap-2">
            {data.cityHints.map(({ city, placeCount }) => (
              <li key={city.slug}>
                <Link
                  href={`/cities/${encodeURIComponent(city.slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-brand/30"
                >
                  <span className="font-medium text-brand">
                    {getLocalizedCityDisplayName(locale, city)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("browse.cityHintCount", { count: placeCount })}
                  </span>
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
