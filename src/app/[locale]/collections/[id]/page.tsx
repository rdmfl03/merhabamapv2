import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { GuestConversionHint } from "@/components/account/guest-conversion-hint";
import { PlaceCollectionReportForm } from "@/components/collections/place-collection-report-form";
import { PlaceCard } from "@/components/places/place-card";
import { PublicShareButton } from "@/components/sharing/public-share-button";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildPublicCollectionDetailMetadata } from "@/lib/metadata/collections";
import { clampMetaDescription } from "@/lib/seo/meta-text";
import { buildLocalizedUrl } from "@/lib/seo/site";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { prisma } from "@/lib/prisma";
import { getPlaceCollectionDetail } from "@/server/queries/collections/get-place-collection-detail";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type CollectionDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
};

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  const session = await auth();
  const detail = await getPlaceCollectionDetail({
    collectionId: id,
    viewerUserId: session?.user?.id ?? null,
  });
  if (!detail) {
    return {
      title: t("notFound"),
      robots: robotsNoIndex,
    };
  }
  const indexable = detail.visibility === "PUBLIC";
  const rawDescription =
    detail.description?.trim() || t("detailMetaDescriptionFallback");
  return buildPublicCollectionDetailMetadata({
    locale,
    collectionId: id,
    title: detail.title,
    description: clampMetaDescription(rawDescription),
    indexable,
  });
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const [t, tSaved, detail] = await Promise.all([
    getTranslations("collections"),
    getTranslations("saved"),
    getPlaceCollectionDetail({ collectionId: id, viewerUserId: viewerId }),
  ]);

  if (!detail) {
    notFound();
  }

  await trackProductInsight({
    name: "public_collection_view",
    payload: {
      locale,
      authenticated: Boolean(viewerId),
      browseMode: "detail",
      collectionId: id,
    },
  });

  const ownerLabel =
    detail.owner.name?.trim() ||
    (detail.owner.username ? `@${detail.owner.username}` : "—");

  const placeIds = detail.items.map((i) => i.place.id);
  const savedRows =
    viewerId && placeIds.length > 0
      ? await prisma.savedPlace.findMany({
          where: { userId: viewerId, placeId: { in: placeIds } },
          select: { placeId: true },
        })
      : [];
  const savedSet = new Set(savedRows.map((r) => r.placeId));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/collections" className="text-brand underline-offset-2 hover:underline">
              {t("title")}
            </Link>
          </p>
          {detail.visibility === "PUBLIC" ? (
            <PublicShareButton
              locale={locale}
              insightSurface="collection_detail"
              absoluteUrl={buildLocalizedUrl(locale, `/collections/${id}`)}
              canonicalPath={`/${locale}/collections/${id}`}
              title={detail.title}
              text={
                detail.description?.trim()
                  ? clampMetaDescription(detail.description)
                  : undefined
              }
            />
          ) : null}
        </div>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{detail.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("detailOwnerPrefix")}{" "}
          {detail.owner.username ? (
            <Link
              href={`/user/${encodeURIComponent(detail.owner.username)}`}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              {ownerLabel}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{ownerLabel}</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("detailItemCount", { n: detail.itemCount })}
        </p>
        {detail.description ? (
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-foreground">{detail.description}</p>
        ) : null}
        {detail.visibility === "PUBLIC" && !viewerId ? (
          <div className="mt-4 max-w-xl">
            <GuestConversionHint locale={locale} returnPath={`/${locale}/collections/${id}`} />
          </div>
        ) : null}
      </div>

      {detail.visibility === "PUBLIC" ? (
        <PlaceCollectionReportForm
          collectionId={detail.id}
          locale={locale}
          returnPath={`/${locale}/collections/${id}`}
          isAuthenticated={Boolean(viewerId)}
          signInHref={`/auth/signin?next=${encodeURIComponent(`/${locale}/collections/${id}`)}`}
          labels={{
            title: t("report.title"),
            description: t("report.description"),
            reasonLabel: t("report.reasonLabel"),
            detailsLabel: t("report.detailsLabel"),
            detailsPlaceholder: t("report.detailsPlaceholder"),
            submit: t("report.submit"),
            signIn: t("report.signIn"),
            success: t("report.success"),
            error: t("report.error"),
            cooldown: t("report.cooldown"),
            dailyLimit: t("report.dailyLimit"),
            trustFootnotePrefix: t("report.trustFootnotePrefix"),
            trustFootnoteLink: t("report.trustFootnoteLink"),
            trustFootnoteSuffix: t("report.trustFootnoteSuffix"),
          }}
          reasons={[
            {
              value: "INACCURATE_INFORMATION",
              label: t("report.reasons.inaccurateInformation"),
            },
            { value: "DUPLICATE", label: t("report.reasons.duplicate") },
            {
              value: "CLOSED_OR_UNAVAILABLE",
              label: t("report.reasons.closedOrUnavailable"),
            },
            {
              value: "INAPPROPRIATE_CONTENT",
              label: t("report.reasons.inappropriateContent"),
            },
            { value: "SPAM_OR_ABUSE", label: t("report.reasons.spamOrAbuse") },
            { value: "OTHER", label: t("report.reasons.other") },
          ]}
        />
      ) : null}

      {detail.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("detailEmpty")}
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {detail.items.map(({ place }) => {
            const placeWithSaved = { ...place, isSaved: savedSet.has(place.id) };
            return (
              <PlaceCard
                key={place.id}
                place={placeWithSaved}
                locale={locale}
                description={getLocalizedText(
                  { de: place.descriptionDe, tr: place.descriptionTr },
                  locale,
                  tSaved("places.fallbackDescription"),
                )}
                categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                returnPath={`/${locale}/collections/${id}`}
                isAuthenticated={Boolean(viewerId)}
                labels={{
                  details: tSaved("common.details"),
                  save: tSaved("common.save"),
                  saved: tSaved("common.saved"),
                  saving: tSaved("common.saving"),
                  signIn: tSaved("common.signIn"),
                  verified: tSaved("common.verified"),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
