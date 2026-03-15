import type { Metadata } from "next";
import { Globe, MapPin, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { PlaceClaimForm } from "@/components/places/place-claim-form";
import { PlaceMapPreview } from "@/components/places/place-map-preview";
import { PlaceReportForm } from "@/components/places/place-report-form";
import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge, PlaceTrustHelper } from "@/components/places/place-trust-badge";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { buildPlaceDetailMetadata } from "@/lib/metadata/places";
import {
  getLocalizedText,
  getPlaceImage,
  getVerificationTone,
  parseOpeningHours,
} from "@/lib/places";
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

  return buildPlaceDetailMetadata({
    locale,
    slug,
    title: place.name,
    description,
    image: getPlaceImage(place.images),
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
  const image = getPlaceImage(place.images);
  const verificationTone = getVerificationTone(place.verificationStatus);
  const cityLabel = locale === "tr" ? place.city.nameTr : place.city.nameDe;
  const categoryLabel =
    locale === "tr" ? place.category.nameTr : place.category.nameDe;
  const returnPath = `/${locale}/places/${place.slug}`;

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
          image,
        })}
      />
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-brand-soft via-white to-brand-soft sm:h-96">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={place.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                  {categoryLabel}
                </p>
                <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
                  {place.name}
                </h1>
              </div>
            )}
          </div>
        </div>

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

              {verificationTone === "verified" || verificationTone === "claimed" ? (
                <PlaceTrustBadge
                  status={place.verificationStatus}
                  labels={{
                    claimed: t("badges.claimed"),
                    verified: t("badges.verified"),
                  }}
                />
              ) : null}
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{description}</p>

            <PlaceTrustHelper
              status={place.verificationStatus}
              labels={{
                claimedTitle: t("trust.claimedTitle"),
                claimedDescription: t("trust.claimedDescription"),
                verifiedTitle: t("trust.verifiedTitle"),
                verifiedDescription: t("trust.verifiedDescription"),
              }}
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
                    {place.addressLine1 ?? t("detail.missingAddress")}
                    {place.postalCode
                      ? `, ${place.postalCode} ${cityLabel}`
                      : ""}
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
                      <span className="font-medium text-foreground">{entry.day}</span>
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
            address={[
              place.addressLine1,
              place.postalCode,
              cityLabel,
            ]
              .filter(Boolean)
              .join(", ")}
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
