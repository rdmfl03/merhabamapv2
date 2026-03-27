import { CalendarDays, ExternalLink, MapPin } from "lucide-react";

import { EventSaveButton } from "@/components/events/event-save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  formatEventDateRange,
  formatEventDayBadge,
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

  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="relative">
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#f5f6f8] via-white to-[#eef1f5]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText ?? event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="space-y-2 text-center">
              <Badge>{formatEventDayBadge(locale, event.startsAt)}</Badge>
              <p className="px-6 text-sm font-medium text-brand">{event.title}</p>
            </div>
          )}
        </div>
        <div className="absolute left-4 top-4">
          <Badge>{formatEventDayBadge(locale, event.startsAt)}</Badge>
        </div>
        {image?.isFallback ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
            {locale === "tr" ? "Fallback gorsel" : "Fallback-Bild"}
          </div>
        ) : null}
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
