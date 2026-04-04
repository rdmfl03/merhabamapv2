import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { PublicSearchPage } from "@/components/search/public-search-page";
import { buildCategoryBrowseMetadata } from "@/lib/metadata/public";
import {
  buildPublicSearchPath,
  publicSearchMetadataPath,
} from "@/lib/search/public-search-path";
import { getPlaceFilters } from "@/server/queries/places/get-place-filters";
import { searchPublicPlacesAndEvents } from "@/server/queries/search/search-public-entities";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

type SearchPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const city = firstParam(raw.city);
  const t = await getTranslations({ locale, namespace: "search" });
  const title =
    q.length >= 2 ? t("metaTitleWithQuery", { query: q }) : t("metaTitle");
  const description =
    q.length >= 2 ? t("metaDescriptionWithQuery", { query: q }) : t("metaDescription");

  return buildCategoryBrowseMetadata({
    locale,
    path: publicSearchMetadataPath({ q, city }),
    title,
    description,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const cityRaw = firstParam(raw.city);

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  let filterData: Awaited<ReturnType<typeof getPlaceFilters>> = { cities: [], categories: [] };
  try {
    filterData = await getPlaceFilters({});
  } catch {
    filterData = { cities: [], categories: [] };
  }

  const result =
    q.length >= 2
      ? await searchPublicPlacesAndEvents({
          q,
          citySlug: cityRaw,
          viewerUserId: session?.user?.id ?? null,
        })
      : null;

  const returnPath = buildPublicSearchPath(locale, { q, city: cityRaw });
  const hasQuery = q.length >= 2;
  const hasCityFilter = Boolean(cityRaw?.trim());

  await trackProductInsight({
    name: "public_search_view",
    payload: {
      locale,
      authenticated: Boolean(session?.user?.id),
      hasQuery,
      hasCityFilter,
    },
  });

  if (session?.user?.id && hasQuery) {
    await trackProductInsight({
      name: "search_submit",
      payload: {
        locale,
        authenticated: true,
        hasQuery: true,
        hasCityFilter,
      },
    });
  }

  return (
    <PublicSearchPage
      locale={locale}
      initialQ={q}
      initialCity={cityRaw}
      cities={filterData.cities}
      result={result}
      returnPath={returnPath}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
