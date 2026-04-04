import type { Metadata } from "next";
import { Globe, MapPin, Phone, Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PlaceClaimForm } from "@/components/places/place-claim-form";
import { PlaceDetailHero } from "@/components/places/place-detail-hero";
import { PlaceMapPreview } from "@/components/places/place-map-preview";
import { PlaceReportForm } from "@/components/places/place-report-form";
import { EntityCommentsSection } from "@/components/comments/entity-comments-section";
import { PlaceCollectionsPanel } from "@/components/collections/place-collections-panel";
import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge, PlaceTrustHelper } from "@/components/places/place-trust-badge";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildPlaceDetailMetadata } from "@/lib/metadata/places";
import { clampMetaDescription } from "@/lib/seo/meta-text";
import { formatDisplayAddress } from "@/lib/format-display-address";
import {
  formatOpeningHoursDay,
  formatPlaceRatingSourceCaption,
  getPlaceDisplayRatingSummary,
  getLocalizedText,
  getLocalizedPlaceCategoryLabel,
  hasPlaceDisplayRatingSummary,
  parseOpeningHours,
  resolvePlaceImage,
} from "@/lib/places";
import {
  PlaceGooglePlacesFootnote,
  PlaceGooglePlacesRatingAside,
} from "@/components/places/place-google-places-rating";
import { getPlaceImageFallbackKey } from "@/lib/category-fallback-visual";
import {
  getGooglePlacesRatingSnapshotFromPlace,
  isAggregatedRatingFromGoogleOnly,
} from "@/lib/google-places-display";
import { buildLocalizedUrl } from "@/lib/seo/site";
import { buildPlaceSchema } from "@/lib/seo/structured-data";
import { GuestConversionHint } from "@/components/account/guest-conversion-hint";
import { DetailCommunityContext } from "@/components/detail/detail-community-context";
import { PublicShareButton } from "@/components/sharing/public-share-button";
import { getPlaceCollectionMembershipFlags } from "@/server/queries/collections/get-place-collection-membership-flags";
import { hasCreatorEntityContributionForPlace } from "@/server/queries/contributions/has-creator-entity-contribution";
import { getCategoryIdsEligibleForBrowse } from "@/server/queries/categories/category-browse-eligibility";
import { getPlaceBySlug } from "@/server/queries/places/get-place-by-slug";
import { getPlaceDetailSocialContext } from "@/server/queries/places/get-place-detail-social-context";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

type PlaceDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export async function generateMetadata({
  params,
}: PlaceDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const place = await getPlaceBySlug({ slug });

  if (!place) {
    return {};
  }

  const cityLabel = getLocalizedCityDisplayName(locale, place.city);
  const description = clampMetaDescription(
    getLocalizedText(
      { de: place.descriptionDe, tr: place.descriptionTr },
      locale,
      place.name,
    ),
  );
  const image = resolvePlaceImage(place);

  return buildPlaceDetailMetadata({
    locale,
    slug,
    title: `${place.name} · ${cityLabel}`,
    description,
    image: image?.url,
  });
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, tGuest, session] = await Promise.all([
    getTranslations("places"),
    getTranslations("guestConversion"),
    auth(),
  ]);
  const signedInUser = session?.user;

  if (!signedInUser?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/places/${slug}`)}`);
  }

  const place = await getPlaceBySlug({
    slug,
    userId: signedInUser?.id,
  });

  if (!place) {
    notFound();
  }

  await trackProductInsight({
    name: "public_place_view",
    payload: {
      locale,
      authenticated: Boolean(signedInUser?.id),
    },
  });

  const [membershipRows, showUserSubmittedAttribution, placeSocialContext, categoryBrowseEligible] =
    await Promise.all([
      signedInUser?.id != null
        ? getPlaceCollectionMembershipFlags(signedInUser.id, place.id)
        : Promise.resolve([]),
      hasCreatorEntityContributionForPlace(place.id),
      getPlaceDetailSocialContext(place.id),
      getCategoryIdsEligibleForBrowse([place.category.id]).then((ids) =>
        ids.includes(place.category.id),
      ),
    ]);

  const description = getLocalizedText(
    { de: place.descriptionDe, tr: place.descriptionTr },
    locale,
    t("detail.fallbackDescription"),
  );
  const openingHours = parseOpeningHours(place.openingHoursJson);
  const image = resolvePlaceImage(place);
  const ratingSummary = getPlaceDisplayRatingSummary(place);
  const safeRatingSummary = hasPlaceDisplayRatingSummary(ratingSummary)
    ? ratingSummary
    : null;
  const cityLabel = getLocalizedCityDisplayName(locale, place.city);
  const categoryLabel = getLocalizedPlaceCategoryLabel(place.category, locale);
  const returnPath = `/${locale}/places/${place.slug}`;
  const showCurationHint =
    place.moderationStatus === "APPROVED" && place.isPublished;
  const ratingUpdatedLabel =
    safeRatingSummary?.updatedAt
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeZone: "Europe/Berlin",
        }).format(safeRatingSummary.updatedAt)
      : null;
  const ratingSourcesAttribution = formatPlaceRatingSourceCaption(
    locale,
    safeRatingSummary,
  );
  const googlePlacesSnap = getGooglePlacesRatingSnapshotFromPlace(place);
  const showGooglePlacesFootnote =
    googlePlacesSnap != null &&
    safeRatingSummary != null &&
    isAggregatedRatingFromGoogleOnly(safeRatingSummary);
  const showGooglePlacesAside =
    googlePlacesSnap != null &&
    (safeRatingSummary == null ||
      (safeRatingSummary.sources?.length ?? 0) > 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-12">
      <JsonLd
        data={buildPlaceSchema({
          locale,
          slug: place.slug,
          name: place.name,
          description,
          cityName: cityLabel,
          addressLine1: place.addressLine1,
          postalCode: place.postalCode,
          phone: place.phone,
          websiteUrl: place.websiteUrl,
          image: image?.url,
          latitude: place.latitude,
          longitude: place.longitude,
          aggregateRating: safeRatingSummary
            ? {
                ratingValue: safeRatingSummary.value,
                ratingCount: safeRatingSummary.count,
              }
            : null,
        })}
      />
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <PlaceDetailHero
          image={image}
          placeName={place.name}
          categoryLabel={categoryLabel}
          fallbackVisualKey={getPlaceImageFallbackKey(place)}
          locale={locale}
          attributionLabels={{
            license: t("imageAttribution.license"),
            sourceLink: t("imageAttribution.sourceLink"),
            rightsLink: t("imageAttribution.rightsLink"),
            provider: t("imageAttribution.provider"),
            requiredNotice: t("imageAttribution.requiredNotice"),
          }}
        />

        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                {categoryBrowseEligible ? (
                  <Link
                    href={`/categories/${encodeURIComponent(place.category.slug)}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {categoryLabel}
                  </Link>
                ) : (
                  categoryLabel
                )}
              </p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">
                  {place.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <Link
                    href={`/cities/${encodeURIComponent(place.city.slug)}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {cityLabel}
                  </Link>
                </div>
              </div>

              {place.verificationStatus === "VERIFIED" ? (
                <PlaceTrustBadge
                  status={place.verificationStatus}
                  labels={{
                    verified: t("badges.verified"),
                  }}
                />
              ) : null}
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{description}</p>

            {showUserSubmittedAttribution ? (
              <p className="text-xs text-muted-foreground">{t("detail.userSubmittedAttribution")}</p>
            ) : null}

            {safeRatingSummary ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  <span>{safeRatingSummary.value.toFixed(1)} / 5</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "tr"
                    ? `${new Intl.NumberFormat("tr-TR").format(safeRatingSummary.count)} değerlendirme`
                    : `${new Intl.NumberFormat("de-DE").format(safeRatingSummary.count)} Bewertungen`}
                  {" · "}
                  {locale === "tr"
                    ? `${new Intl.NumberFormat("tr-TR").format(safeRatingSummary.sourceCount)} kaynak`
                    : `${new Intl.NumberFormat("de-DE").format(safeRatingSummary.sourceCount)} Quellen`}
                  {ratingUpdatedLabel
                    ? locale === "tr"
                      ? ` · Güncelleme ${ratingUpdatedLabel}`
                      : ` · Stand ${ratingUpdatedLabel}`
                    : ""}
                </p>
                {ratingSourcesAttribution ? (
                  <p className="mt-1 text-xs text-muted-foreground">{ratingSourcesAttribution}</p>
                ) : null}
                {showGooglePlacesFootnote ? (
                  <PlaceGooglePlacesFootnote
                    text={t("detail.googlePlacesDataNotice")}
                  />
                ) : null}
              </div>
            ) : null}

            {showGooglePlacesAside && googlePlacesSnap ? (
              <PlaceGooglePlacesRatingAside
                locale={locale}
                snapshot={googlePlacesSnap}
                labels={{
                  title: t("detail.googlePlacesRatingAsideTitle"),
                  reviews: t("detail.googlePlacesReviewCountLabel"),
                  updatedLabel: t("detail.googlePlacesUpdatedLabel"),
                }}
              />
            ) : null}

            {showCurationHint ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {t("detail.curationHintTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("detail.curationHintDescription")}
                </p>
              </div>
            ) : null}

            {place.verificationStatus === "VERIFIED" ? (
              <PlaceTrustHelper
                status={place.verificationStatus}
                labels={{
                  claimedTitle: t("trust.claimedTitle"),
                  claimedDescription: t("trust.claimedDescription"),
                  verifiedTitle: t("trust.verifiedTitle"),
                  verifiedDescription: t("trust.verifiedDescription"),
                }}
              />
            ) : null}

            <DetailCommunityContext
              variant="place"
              commentCount={placeSocialContext.commentCount}
              saveCount={placeSocialContext.saveCount}
              publicListCount={placeSocialContext.publicListCount}
              latestCommentAt={placeSocialContext.latestCommentAt}
            />

            <div className="flex flex-wrap gap-3">
              <PlaceSaveButton
                placeId={place.id}
                locale={locale}
                returnPath={returnPath}
                isSaved={place.isSaved}
                isAuthenticated={Boolean(signedInUser?.id)}
                signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
                labels={{
                  save: t("card.save"),
                  saved: t("card.saved"),
                  saving: t("card.saving"),
                  signIn: t("card.signIn"),
                }}
              />
              <PublicShareButton
                locale={locale}
                insightSurface="place_detail"
                absoluteUrl={buildLocalizedUrl(locale, `/places/${place.slug}`)}
                canonicalPath={`/${locale}/places/${place.slug}`}
                title={`${place.name} · ${cityLabel}`}
                text={description}
              />
            </div>

            {!signedInUser ? (
              <GuestConversionHint locale={locale} returnPath={returnPath} />
            ) : null}

            <PlaceCollectionsPanel
              placeId={place.id}
              locale={locale}
              returnPath={returnPath}
              signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
              isAuthenticated={Boolean(signedInUser?.id)}
              membershipRows={membershipRows}
              labels={{
                title: t("detail.collections.title"),
                emptyHint: t("detail.collections.emptyHint"),
                manageLink: t("detail.collections.manageLink"),
                privateBadge: t("detail.collections.privateBadge"),
                signIn: t("detail.collections.signIn"),
                signUp: tGuest("signUp"),
                signInHint: t("detail.collections.signInHint"),
              }}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="bg-white/90">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-display text-2xl text-foreground">
                {t("detail.infoTitle")}
              </h2>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{t("detail.address")}</p>
                  <p>
                    {(() => {
                      const line = formatDisplayAddress({
                        streetLine: place.addressLine1,
                        postalCode: place.postalCode,
                        cityLabel,
                      });
                      return line || t("detail.missingAddress");
                    })()}
                  </p>
                </div>

                {place.phone ? (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{t("detail.phone")}</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${place.phone}`}>{place.phone}</a>
                    </p>
                  </div>
                ) : null}

                {place.websiteUrl ? (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{t("detail.website")}</p>
                    <p className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={place.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-brand"
                      >
                        {place.websiteUrl}
                      </a>
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-display text-2xl text-foreground">
                {t("detail.hoursTitle")}
              </h2>
              {openingHours.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("detail.hoursUnavailable")}
                </p>
              ) : (
                <div className="space-y-3">
                  {openingHours.map((entry) => (
                    <div
                      key={`${entry.day}-${entry.open}-${entry.close}`}
                      className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {formatOpeningHoursDay(entry.day, locale)}
                      </span>
                      <span className="text-muted-foreground">
                        {entry.open} - {entry.close}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <PlaceMapPreview
            latitude={place.latitude}
            longitude={place.longitude}
            address={formatDisplayAddress({
              streetLine: place.addressLine1,
              postalCode: place.postalCode,
              cityLabel,
            })}
            labels={{
              title: t("detail.mapTitle"),
              description: t("detail.mapDescription"),
              openMap: t("detail.openMap"),
              unavailable: t("detail.mapUnavailable"),
            }}
          />
        </div>

        <div className="space-y-6">
          <PlaceClaimForm
            placeId={place.id}
            locale={locale}
            returnPath={returnPath}
            isAuthenticated={Boolean(signedInUser?.id)}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
            defaultName={signedInUser?.name}
            defaultEmail={signedInUser?.email}
            labels={{
              title: t("claim.title"),
              description: t("claim.description"),
              nameLabel: t("claim.nameLabel"),
              emailLabel: t("claim.emailLabel"),
              phoneLabel: t("claim.phoneLabel"),
              messageLabel: t("claim.messageLabel"),
              messagePlaceholder: t("claim.messagePlaceholder"),
              evidenceLabel: t("claim.evidenceLabel"),
              evidencePlaceholder: t("claim.evidencePlaceholder"),
              submit: t("claim.submit"),
              signIn: t("claim.signIn"),
              success: t("claim.success"),
              error: t("claim.error"),
              cooldown: t("claim.cooldown"),
            }}
          />

          <Card className="bg-white/90">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold text-foreground">{t("detail.noticeTitle")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("detail.noticeDescription")}
              </p>
            </CardContent>
          </Card>

          <EntityCommentsSection
            entityType="place"
            entityId={place.id}
            locale={locale}
            viewerId={signedInUser?.id ?? null}
            returnPath={returnPath}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
          />

          <PlaceReportForm
            placeId={place.id}
            locale={locale}
            returnPath={returnPath}
            isAuthenticated={Boolean(signedInUser?.id)}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
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
              reasons: [
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
                {
                  value: "SPAM_OR_ABUSE",
                  label: t("report.reasons.spamOrAbuse"),
                },
                { value: "OTHER", label: t("report.reasons.other") },
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
