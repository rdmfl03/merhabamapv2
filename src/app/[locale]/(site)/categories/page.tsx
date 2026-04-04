import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { buildCategoryBrowseMetadata } from "@/lib/metadata/public";
import { getLocalizedPlaceCategoryLabel } from "@/lib/places";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { listPublicCategoryBrowseSummaries } from "@/server/queries/categories/list-public-category-browse-summaries";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type CategoriesIndexProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: CategoriesIndexProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "placeCategories" });
  const summaries = await listPublicCategoryBrowseSummaries();

  if (summaries.length === 0) {
    return {
      title: t("index.metaTitle"),
      description: t("index.metaDescription"),
      robots: robotsNoIndex,
    };
  }

  return buildCategoryBrowseMetadata({
    locale,
    path: "/categories",
    title: t("index.metaTitle"),
    description: t("index.metaDescription"),
  });
}

export default async function CategoriesIndexPage({ params }: CategoriesIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  await trackProductInsight({
    name: "public_category_browse_view",
    payload: {
      locale,
      authenticated: Boolean(session?.user?.id),
      browseMode: "index",
    },
  });

  const [t, summaries] = await Promise.all([
    getTranslations({ locale, namespace: "placeCategories" }),
    listPublicCategoryBrowseSummaries(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("index.eyebrow")}</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("index.title")}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("index.intro")}</p>
      </header>

      {summaries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("index.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {summaries.map((row) => {
            const label = getLocalizedPlaceCategoryLabel(row, locale);
            return (
              <li key={row.id}>
                <Link
                  href={`/categories/${encodeURIComponent(row.slug)}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm transition-colors hover:border-brand/25"
                >
                  <span className="font-medium text-brand">{label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t("index.placeCount", { count: row.placeCount })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
