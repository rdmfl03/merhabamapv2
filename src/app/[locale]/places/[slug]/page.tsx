import type { Metadata } from "next";
import { Globe, MapPin, Phone, Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { PlaceClaimForm } from "@/components/places/place-claim-form";
import { PlaceDetailHero } from "@/components/places/place-detail-hero";
import { PlaceMapPreview } from "@/components/places/place-map-preview";
import { PlaceReportForm } from "@/components/places/place-report-form";
import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge, PlaceTrustHelper } from "@/components/places/place-trust-badge";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { buildPlaceDetailMetadata } from "@/lib/metadata/places";
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
import { getPlaceImageFallbackKey } from "@/lib/category-fallback-visual";
import { buildPlaceSchema } from "@/lib/seo/structured-data";
import { getPlaceBySlug } from "@/server/queries/places/get-place-by-slug";

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

  const description = getLocalizedText(
    { de: place.descriptionDe, tr: place.descriptionTr },
    locale,
    place.name,
  );
  const image = resolvePlaceImage(place);

  return buildPlaceDetailMetadata({
    locale,
    slug,
    title: place.name,
    description,
    image: image?.url,
  });
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, session] = await Promise.all([
    getTranslations("places"),
    auth(),
  ]);
  const signedInUser = session?.user;
  const place = await getPlaceBySlug({
    slug,
    userId: signedInUser?.id,
  });

  if (!place) {
    notFound();
  }

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
                {categoryLabel}
              </p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">
                  {place.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{cityLabel}</span>
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
              </div>
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
            </div>
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
