import type { Metadata } from "next";
import { CalendarDays, ExternalLink, Globe, MapPin, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EventMapPreview } from "@/components/events/event-map-preview";
import { EventReportForm } from "@/components/events/event-report-form";
import { EventSaveButton } from "@/components/events/event-save-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatEventDateRange,
  getEventCategoryLabelKey,
  getLocalizedEventText,
  getSafeExternalUrl,
} from "@/lib/events";
import { buildEventDetailMetadata } from "@/lib/metadata/events";
import { buildEventSchema } from "@/lib/seo/structured-data";
import { getEventBySlug } from "@/server/queries/events/get-event-by-slug";

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

  return buildEventDetailMetadata({
    locale,
    slug,
    title: event.title,
    description: getLocalizedEventText(
      { de: event.descriptionDe, tr: event.descriptionTr },
      locale,
      event.title,
    ),
    image: event.imageUrl,
  });
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, session] = await Promise.all([getTranslations("events"), auth()]);
  const signedInUser = session?.user;
  const event = await getEventBySlug({
    slug,
    userId: signedInUser?.id,
  });

  if (!event) {
    notFound();
  }

  const description = getLocalizedEventText(
    { de: event.descriptionDe, tr: event.descriptionTr },
    locale,
    t("detail.fallbackDescription"),
  );
  const cityLabel = locale === "tr" ? event.city.nameTr : event.city.nameDe;
  const categoryLabel = t(`categories.${getEventCategoryLabelKey(event.category)}`);
  const returnPath = `/${locale}/events/${event.slug}`;
  const externalUrl = getSafeExternalUrl(event.externalUrl);
  const address = [event.addressLine1, event.postalCode, cityLabel]
    .filter(Boolean)
    .join(", ");

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
          image: event.imageUrl,
          organizerName: event.organizerName,
        })}
      />
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-brand-soft via-white to-brand-soft sm:h-96">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="space-y-3 px-8 text-center">
                <Badge>{categoryLabel}</Badge>
                <h1 className="font-display text-4xl text-foreground sm:text-5xl">
                  {event.title}
                </h1>
              </div>
            )}
          </div>
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
                    {cityLabel}
                  </span>
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{description}</p>

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
              {externalUrl ? (
                <Button variant="outline" asChild>
                  <a href={externalUrl} target="_blank" rel="noreferrer">
                    {t("detail.externalLink")}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
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
