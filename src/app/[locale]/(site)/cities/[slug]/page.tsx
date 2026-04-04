import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CityBrowsePage } from "@/components/cities/city-browse-page";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildCityMetadata } from "@/lib/metadata/public";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { getCityBrowseData } from "@/server/queries/cities/get-city-browse-data";
import { isUserFollowingCity } from "@/server/queries/cities/list-followed-cities-for-user";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type CityBrowsePageProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export async function generateMetadata({ params }: CityBrowsePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (slug === "map") {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "cities" });
  const data = await getCityBrowseData({
    citySlug: slug,
    locale,
    viewerUserId: null,
  });

  if (!data) {
    return {
      title: t("browse.notFoundTitle"),
      robots: robotsNoIndex,
    };
  }

  const cityLabel = getLocalizedCityDisplayName(locale, data.city);
  return buildCityMetadata({
    locale,
    path: `/cities/${slug}`,
    title: t("browse.metaTitle", { city: cityLabel }),
    description: t("browse.metaDescription", { city: cityLabel }),
  });
}

export default async function CityBrowseRoute({ params }: CityBrowsePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (slug === "map") {
    redirect(`/${locale}/map`);
  }

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const data = await getCityBrowseData({
    citySlug: slug,
    locale,
    viewerUserId: session?.user?.id ?? null,
  });

  if (!data) {
    notFound();
  }

  await trackProductInsight({
    name: "public_city_browse_view",
    payload: {
      locale,
      authenticated: Boolean(session?.user?.id),
      citySlug: data.city.slug,
    },
  });

  const returnPath = `/${locale}/cities/${slug}`;
  const userId = session?.user?.id ?? null;
  const isFollowingCity =
    userId != null ? await isUserFollowingCity(userId, data.city.id) : false;

  return (
    <CityBrowsePage
      locale={locale}
      data={data}
      returnPath={returnPath}
      isAuthenticated={Boolean(userId)}
      isFollowingCity={isFollowingCity}
    />
  );
}
