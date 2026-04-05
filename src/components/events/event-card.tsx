"use client";

import { CalendarDays, ExternalLink, Map, MapPin, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { EventCoverImage } from "@/components/events/event-cover-image";
import { EventSaveButton } from "@/components/events/event-save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getEventImageFallbackKey } from "@/lib/category-fallback-visual";
import { buildDiscoveryMapPathForEvent } from "@/lib/discovery-map-deep-link";
import {
  formatEventDateRange,
  formatEventDayBadge,
  getEventVenueRatingSummary,
  resolveEventImage,
  getSafeExternalUrl,
} from "@/lib/events";
import type { ListedEvent } from "@/server/queries/events/list-events";

type EventCardProps = {
  event: ListedEvent;
  locale: "de" | "tr";
  description: string;
  categoryLabel: string;
  cityLabel: string;
  returnPath: string;
  isAuthenticated: boolean;
  /** Shown above the category line (e.g. participation status on profile). */
  participationLabel?: string;
  labels: {
    details: string;
    save: string;
    saved: string;
    saving: string;
    signIn: string;
    external: string;
  };
};

export function EventCard({
  event,
  locale,
  description,
  categoryLabel,
  cityLabel,
  returnPath,
  isAuthenticated,
  participationLabel,
  labels,
}: EventCardProps) {
  const t = useTranslations("events");
  const externalUrl = getSafeExternalUrl(event.externalUrl);
  const mapCitySlug = event.city.slug?.trim() ?? "";
  const image = resolveEventImage(event);
  const venueRating = getEventVenueRatingSummary(event);

  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="relative">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#f5f6f8]">
          <EventCoverImage
            src={image?.url ?? ""}
            alt={image?.altText ?? event.title}
            title={event.title}
            visualKey={getEventImageFallbackKey(event.category)}
            showDbFallbackBadge={Boolean(image?.isFallback)}
            fallbackBadgeLabel={
              locale === "tr" ? "Fallback gorsel" : "Fallback-Bild"
            }
          />
        </div>
        <div className="absolute left-4 top-4">
          <Badge>{formatEventDayBadge(locale, event.startsAt)}</Badge>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        {participationLabel ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {participationLabel}
          </p>
        ) : null}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {categoryLabel}
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            <Link href={`/events/${event.slug}`}>{event.title}</Link>
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{formatEventDateRange(locale, event.startsAt, event.endsAt)}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>
                {isAuthenticated && event.venueName ? `${event.venueName}, ` : ""}
                {event.city.slug ? (
                  <Link
                    href={`/cities/${encodeURIComponent(event.city.slug)}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {cityLabel}
                  </Link>
                ) : (
                  cityLabel
                )}
              </span>
            </p>
            {venueRating ? (
              <p className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                <span>
                  {venueRating.value.toFixed(1)} / 5 ({new Intl.NumberFormat(locale).format(venueRating.count)})
                </span>
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {mapCitySlug ? (
              <Button
                size="sm"
                variant="default"
                className="border-0 bg-turquoise px-2.5 text-white shadow-sm hover:bg-turquoise-dark focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2"
                asChild
              >
                <Link
                  href={buildDiscoveryMapPathForEvent(mapCitySlug, event.id)}
                  aria-label={t("card.showOnMap")}
                  title={t("card.showOnMap")}
                >
                  <Map className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
            {isAuthenticated ? (
              <EventSaveButton
                eventId={event.id}
                locale={locale}
                returnPath={returnPath}
                isSaved={event.isSaved}
                isAuthenticated
                signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
                labels={{
                  save: labels.save,
                  saved: labels.saved,
                  saving: labels.saving,
                  signIn: labels.signIn,
                }}
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {externalUrl && isAuthenticated ? (
              <Button variant="outline" size="sm" asChild>
                <a href={externalUrl} target="_blank" rel="noreferrer">
                  {labels.external}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/events/${event.slug}`}>{labels.details}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
