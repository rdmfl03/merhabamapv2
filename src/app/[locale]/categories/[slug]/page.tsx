import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CategoryBrowsePage } from "@/components/categories/category-browse-page";
import { buildCategoryBrowseMetadata } from "@/lib/metadata/public";
import { getLocalizedPlaceCategoryLabel } from "@/lib/places";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { getCategoryBrowseData } from "@/server/queries/categories/get-category-browse-data";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type CategoryBrowseRouteProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export async function generateMetadata({ params }: CategoryBrowseRouteProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "placeCategories" });
  const data = await getCategoryBrowseData({
    categorySlug: slug,
    locale,
    viewerUserId: null,
  });

  if (!data) {
    return {
      title: t("browse.notFoundTitle"),
      robots: robotsNoIndex,
    };
  }

  const categoryLabel = getLocalizedPlaceCategoryLabel(data.category, locale);
  return buildCategoryBrowseMetadata({
    locale,
    path: `/categories/${slug}`,
    title: t("browse.metaTitle", { category: categoryLabel }),
    description: t("browse.metaDescription", { category: categoryLabel }),
  });
}

export default async function CategoryBrowseRoute({ params }: CategoryBrowseRouteProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const data = await getCategoryBrowseData({
    categorySlug: slug,
    locale,
    viewerUserId: session?.user?.id ?? null,
  });

  if (!data) {
    notFound();
  }

  await trackProductInsight({
    name: "public_category_browse_view",
    payload: {
      locale,
      authenticated: Boolean(session?.user?.id),
      browseMode: "detail",
      categorySlug: data.category.slug,
    },
  });

  const returnPath = `/${locale}/categories/${slug}`;

  return (
    <CategoryBrowsePage
      locale={locale}
      data={data}
      returnPath={returnPath}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
