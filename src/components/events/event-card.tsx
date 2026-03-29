import { CalendarDays, ExternalLink, MapPin, Star } from "lucide-react";

import { EventCoverImage } from "@/components/events/event-cover-image";
import { EventSaveButton } from "@/components/events/event-save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getEventImageFallbackKey } from "@/lib/category-fallback-visual";
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
  labels,
}: EventCardProps) {
  const externalUrl = getSafeExternalUrl(event.externalUrl);
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
                {event.venueName ? `${event.venueName}, ` : ""}
                {cityLabel}
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
          <EventSaveButton
            eventId={event.id}
            locale={locale}
            returnPath={returnPath}
            isSaved={event.isSaved}
            isAuthenticated={isAuthenticated}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
            labels={{
              save: labels.save,
              saved: labels.saved,
              saving: labels.saving,
              signIn: labels.signIn,
            }}
          />

          <div className="flex gap-2">
            {externalUrl ? (
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
