"use client";

import { CalendarDays, Map, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { EventCoverImage } from "@/components/events/event-cover-image";
import { EventSaveButton } from "@/components/events/event-save-button";
import { PlaceCoverImage } from "@/components/places/place-cover-image";
import { PlaceSaveButton } from "@/components/places/place-save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getEventImageFallbackKey, getPlaceImageFallbackKey } from "@/lib/category-fallback-visual";
import {
  formatEventDateRange,
  formatEventDayBadge,
  resolveEventImage,
} from "@/lib/events";
import { buildDiscoveryMapPathForEvent, buildDiscoveryMapPathForPlace } from "@/lib/discovery-map-deep-link";
import { resolvePlaceImage } from "@/lib/places";
import type { ListedEvent } from "@/server/queries/events/list-events";
import type { ListedPlace } from "@/server/queries/places/list-places";

type PlaceRowLabels = {
  details: string;
  save: string;
  saved: string;
  saving: string;
  signIn: string;
  verified: string;
};

export function ProfileSavedPlaceListRow({
  place,
  locale,
  description,
  categoryLabel,
  categoryHref,
  cityLabel,
  returnPath,
  isAuthenticated,
  signInHref,
  labels,
}: {
  place: ListedPlace;
  locale: "de" | "tr";
  description: string;
  categoryLabel: string;
  /** When set, category label links to public category browse. */
  categoryHref?: string;
  cityLabel: string;
  returnPath: string;
  isAuthenticated: boolean;
  signInHref: string;
  labels: PlaceRowLabels;
}) {
  const tPlaces = useTranslations("places");
  const image = resolvePlaceImage(place);
  const mapCitySlug = place.city.slug?.trim() ?? "";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-stretch sm:gap-4">
      <Link
        href={`/places/${place.slug}`}
        className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f6f8] sm:w-36"
      >
        <div className="absolute inset-0">
          <PlaceCoverImage
            src={image?.url ?? ""}
            alt={image?.altText ?? place.name}
            fallbackText={place.name}
            fallbackVisualKey={getPlaceImageFallbackKey(place)}
            showFallbackBadge={Boolean(image?.isFallback)}
            fallbackBadgeLabel={locale === "tr" ? "Yedek görsel" : "Fallback-Bild"}
          />
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {categoryHref ? (
              <Link href={categoryHref} className="underline-offset-2 hover:underline">
                {categoryLabel}
              </Link>
            ) : (
              categoryLabel
            )}
          </p>
          <h3 className="text-base font-semibold text-foreground">
            <Link href={`/places/${place.slug}`} className="underline-offset-2 hover:underline">
              {place.name}
            </Link>
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{cityLabel}</span>
          </p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mapCitySlug ? (
            <Button
              size="sm"
              variant="default"
              className="border-0 bg-turquoise px-2.5 text-white shadow-sm hover:bg-turquoise-dark focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2"
              asChild
            >
              <Link
                href={buildDiscoveryMapPathForPlace(mapCitySlug, place.id)}
                aria-label={tPlaces("card.showOnMap")}
                title={tPlaces("card.showOnMap")}
              >
                <Map className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
          {isAuthenticated ? (
            <PlaceSaveButton
              placeId={place.id}
              locale={locale}
              returnPath={returnPath}
              isSaved={place.isSaved}
              isAuthenticated
              signInHref={signInHref}
              labels={{
                save: labels.save,
                saved: labels.saved,
                saving: labels.saving,
                signIn: labels.signIn,
              }}
            />
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/places/${place.slug}`}>{labels.details}</Link>
          </Button>
        </div>
      </div>
    </li>
  );
}

type EventRowLabels = {
  details: string;
  save: string;
  saved: string;
  saving: string;
  signIn: string;
};

export function ProfileSavedEventListRow({
  event,
  locale,
  description,
  categoryLabel,
  cityLabel,
  returnPath,
  isAuthenticated,
  signInHref,
  participationLabel,
  labels,
}: {
  event: ListedEvent;
  locale: "de" | "tr";
  description: string;
  categoryLabel: string;
  cityLabel: string;
  returnPath: string;
  isAuthenticated: boolean;
  signInHref: string;
  participationLabel?: string;
  labels: EventRowLabels;
}) {
  const tEvents = useTranslations("events");
  const image = resolveEventImage(event);
  const mapCitySlug = event.city.slug?.trim() ?? "";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-stretch sm:gap-4">
      <Link
        href={`/events/${event.slug}`}
        className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f6f8] sm:w-36"
      >
        <div className="absolute inset-0">
          <EventCoverImage
            src={image?.url ?? ""}
            alt={image?.altText ?? event.title}
            title={event.title}
            visualKey={getEventImageFallbackKey(event.category)}
            showDbFallbackBadge={Boolean(image?.isFallback)}
            fallbackBadgeLabel={locale === "tr" ? "Fallback gorsel" : "Fallback-Bild"}
          />
        </div>
        <div className="absolute left-2 top-2 z-10">
          <Badge className="text-[10px]">{formatEventDayBadge(locale, event.startsAt)}</Badge>
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {participationLabel ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {participationLabel}
            </p>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{categoryLabel}</p>
          <h3 className="text-base font-semibold text-foreground">
            <Link href={`/events/${event.slug}`} className="underline-offset-2 hover:underline">
              {event.title}
            </Link>
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{formatEventDateRange(locale, event.startsAt, event.endsAt)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{cityLabel}</span>
          </p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>
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
                aria-label={tEvents("card.showOnMap")}
                title={tEvents("card.showOnMap")}
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
              signInHref={signInHref}
              labels={{
                save: labels.save,
                saved: labels.saved,
                saving: labels.saving,
                signIn: labels.signIn,
              }}
            />
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${event.slug}`}>{labels.details}</Link>
          </Button>
        </div>
      </div>
    </li>
  );
}
