import type { Metadata } from "next";
import { CalendarDays, ExternalLink, Globe, MapPin, Star, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { EventHeroMedia } from "@/components/events/event-hero-media";
import { MediaAttribution } from "@/components/media/media-attribution";
import { EventMapPreview } from "@/components/events/event-map-preview";
import { EventReportForm } from "@/components/events/event-report-form";
import { EntityCommentsSection } from "@/components/comments/entity-comments-section";
import { EventParticipationPanel } from "@/components/events/event-participation-panel";
import { EventSaveButton } from "@/components/events/event-save-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  formatEventDateRange,
  getEventVenueRatingSummary,
  getEventCategoryLabelKey,
  getLocalizedEventText,
  resolveEventImage,
  getSafeExternalUrl,
} from "@/lib/events";
import { getEventImageFallbackKey } from "@/lib/category-fallback-visual";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { formatDisplayAddress } from "@/lib/format-display-address";
import { buildEventDetailMetadata } from "@/lib/metadata/events";
import { clampMetaDescription } from "@/lib/seo/meta-text";
import { buildLocalizedUrl } from "@/lib/seo/site";
import { buildEventSchema } from "@/lib/seo/structured-data";
import { GuestConversionHint } from "@/components/account/guest-conversion-hint";
import { DetailCommunityContext } from "@/components/detail/detail-community-context";
import { PublicShareButton } from "@/components/sharing/public-share-button";
import { hasCreatorEntityContributionForEvent } from "@/server/queries/contributions/has-creator-entity-contribution";
import { getEventBySlug } from "@/server/queries/events/get-event-by-slug";
import { getEventDetailSocialContext } from "@/server/queries/events/get-event-detail-social-context";
import { getEventParticipationSummary } from "@/server/queries/events/get-event-participation-summary";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

type EventDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getEventBySlug({ slug });

  if (!event) {
    return {};
  }

  const image = resolveEventImage(event);
  const cityLabel = getLocalizedCityDisplayName(locale, event.city);
  const dateLabel = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(event.startsAt);
  const description = clampMetaDescription(
    getLocalizedEventText(
      { de: event.descriptionDe, tr: event.descriptionTr },
      locale,
      event.title,
    ),
  );

  return buildEventDetailMetadata({
    locale,
    slug,
    title: `${event.title} · ${cityLabel} · ${dateLabel}`,
    description,
    image: image?.url,
  });
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, session] = await Promise.all([getTranslations("events"), auth()]);
  const signedInUser = session?.user;

  if (!signedInUser?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/events/${slug}`)}`);
  }

  const event = await getEventBySlug({
    slug,
    userId: signedInUser?.id,
  });

  if (!event) {
    notFound();
  }

  await trackProductInsight({
    name: "public_event_view",
    payload: {
      locale,
      authenticated: Boolean(signedInUser?.id),
    },
  });

  const [participation, showUserSubmittedAttribution, eventSocialContext] =
    await Promise.all([
      getEventParticipationSummary(event.id, signedInUser?.id ?? null),
      hasCreatorEntityContributionForEvent(event.id),
      getEventDetailSocialContext(event.id),
    ]);

  const description = getLocalizedEventText(
    { de: event.descriptionDe, tr: event.descriptionTr },
    locale,
    t("detail.fallbackDescription"),
  );
  const cityLabel = getLocalizedCityDisplayName(locale, event.city);
  const categoryLabel = t(`categories.${getEventCategoryLabelKey(event.category)}`);
  const returnPath = `/${locale}/events/${event.slug}`;
  const externalUrl = getSafeExternalUrl(event.externalUrl);
  const image = resolveEventImage(event);
  const venueRating = getEventVenueRatingSummary(event);
  const address = formatDisplayAddress({
    streetLine: event.addressLine1,
    postalCode: event.postalCode,
    cityLabel,
  });
  const showCurationHint =
    event.moderationStatus === "APPROVED" && event.isPublished;
  const venueRatingUpdatedLabel =
    venueRating?.updatedAt
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeZone: "Europe/Berlin",
        }).format(venueRating.updatedAt)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-12">
      <JsonLd
        data={buildEventSchema({
          locale,
          slug: event.slug,
          title: event.title,
          description,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt?.toISOString(),
          cityName: cityLabel,
          venueName: event.venueName,
          addressLine1: event.addressLine1,
          postalCode: event.postalCode,
          externalUrl,
          image: image?.url,
          organizerName: event.organizerName,
          latitude: event.latitude,
          longitude: event.longitude,
        })}
      />
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
          <EventHeroMedia
            image={image}
            title={event.title}
            categoryLabel={categoryLabel}
            visualKey={getEventImageFallbackKey(event.category)}
            locale={locale}
          />
          {image ? (
            <div className="space-y-2 border-t border-border/70 bg-white/90 px-5 py-3">
              {image.isFallback ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "tr"
                    ? "Bu gorsel acikca fallback olarak isaretlenmistir ve etkinligin gercek fotografi olmayabilir."
                    : "Dieses Bild ist klar als Fallback markiert und zeigt moeglicherweise nicht das reale Event."}
                </p>
              ) : null}
              <MediaAttribution
                attributionText={image.attributionText}
                attributionUrl={image.attributionUrl}
              />
            </div>
          ) : null}
        </div>

        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-3">
              <Badge>{categoryLabel}</Badge>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">
                  {event.title}
                </h1>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatEventDateRange(locale, event.startsAt, event.endsAt)}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.venueName ? `${event.venueName}, ` : ""}
                    <Link
                      href={`/cities/${encodeURIComponent(event.city.slug)}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {cityLabel}
                    </Link>
                  </span>
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{description}</p>

            {showUserSubmittedAttribution ? (
              <p className="text-xs text-muted-foreground">{t("detail.userSubmittedAttribution")}</p>
            ) : null}

            {venueRating ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {locale === "tr" ? "Mekan puani" : "Venue rating"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  <span>{venueRating.value.toFixed(1)} / 5</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "tr"
                    ? `${new Intl.NumberFormat("tr-TR").format(venueRating.count)} değerlendirme`
                    : `${new Intl.NumberFormat("de-DE").format(venueRating.count)} Bewertungen`}
                  {" · "}
                  {locale === "tr"
                    ? `${new Intl.NumberFormat("tr-TR").format(venueRating.sourceCount)} kaynak`
                    : `${new Intl.NumberFormat("de-DE").format(venueRating.sourceCount)} Quellen`}
                  {venueRatingUpdatedLabel
                    ? locale === "tr"
                      ? ` · Güncelleme ${venueRatingUpdatedLabel}`
                      : ` · Stand ${venueRatingUpdatedLabel}`
                    : ""}
                </p>
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

            <DetailCommunityContext
              variant="event"
              commentCount={eventSocialContext.commentCount}
              saveCount={eventSocialContext.saveCount}
              interestedCount={participation.interestedCount}
              goingCount={participation.goingCount}
              latestCommentAt={eventSocialContext.latestCommentAt}
            />

            <div className="flex flex-wrap gap-3">
              <EventSaveButton
                eventId={event.id}
                locale={locale}
                returnPath={returnPath}
                isSaved={event.isSaved}
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
                insightSurface="event_detail"
                absoluteUrl={buildLocalizedUrl(locale, `/events/${event.slug}`)}
                canonicalPath={`/${locale}/events/${event.slug}`}
                title={`${event.title} · ${cityLabel}`}
                text={description}
              />
              {externalUrl ? (
                <Button variant="outline" asChild>
                  <a href={externalUrl} target="_blank" rel="noreferrer">
                    {t("detail.externalLink")}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>

            {!signedInUser ? (
              <GuestConversionHint locale={locale} returnPath={returnPath} />
            ) : null}

            <EventParticipationPanel
              eventId={event.id}
              locale={locale}
              returnPath={returnPath}
              viewerStatus={participation.viewerStatus}
              isAuthenticated={Boolean(signedInUser?.id)}
              signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
              labels={{
                title: t("detail.participation.title"),
                interested: t("detail.participation.interested"),
                going: t("detail.participation.going"),
                signIn: t("detail.participation.signIn"),
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
                {event.organizerName ? (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{t("detail.organizer")}</p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{event.organizerName}</span>
                    </p>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <p className="font-medium text-foreground">{t("detail.venue")}</p>
                  <p>{event.venueName ?? t("detail.missingVenue")}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-foreground">{t("detail.address")}</p>
                  <p>{address || t("detail.missingAddress")}</p>
                </div>

                {externalUrl ? (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{t("detail.website")}</p>
                    <p className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-brand"
                      >
                        {externalUrl}
                      </a>
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <EventMapPreview
            latitude={event.latitude}
            longitude={event.longitude}
            address={address || cityLabel}
            labels={{
              title: t("detail.mapTitle"),
              description: t("detail.mapDescription"),
              openMap: t("detail.openMap"),
              unavailable: t("detail.mapUnavailable"),
            }}
          />
        </div>

        <div className="space-y-6">
          <Card className="bg-white/90">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold text-foreground">{t("detail.noticeTitle")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("detail.noticeDescription")}
              </p>
            </CardContent>
          </Card>

          <EntityCommentsSection
            entityType="event"
            entityId={event.id}
            locale={locale}
            viewerId={signedInUser?.id ?? null}
            returnPath={returnPath}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
          />

          <EventReportForm
            eventId={event.id}
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
