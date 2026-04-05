"use client";

import { Map, MapPin, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { PlaceCoverImage } from "@/components/places/place-cover-image";
import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge } from "@/components/places/place-trust-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getPlaceImageFallbackKey } from "@/lib/category-fallback-visual";
import { buildDiscoveryMapPathForPlace } from "@/lib/discovery-map-deep-link";
import { getGooglePlacesRatingSnapshotFromPlace } from "@/lib/google-places-display";
import {
  formatPlaceRatingSourceCaption,
  getPlaceDisplayRatingSummary,
  resolvePlaceImage,
} from "@/lib/places";
import type { ListedPlace } from "@/server/queries/places/list-places";
import {
  attributionLabelsForLocale,
  PlaceImageAttribution,
  placeImageAttributionHasContent,
  type PlaceImageAttributionLabels,
} from "@/components/places/place-image-attribution";

type PlaceCardProps = {
  place: ListedPlace;
  locale: "de" | "tr";
  description: string;
  categoryLabel: string;
  /** When set, category line links to public category browse (only if that page exists). */
  categoryHref?: string;
  cityLabel: string;
  returnPath: string;
  isAuthenticated: boolean;
  labels: {
    details: string;
    save: string;
    saved: string;
    saving: string;
    signIn: string;
    verified: string;
  };
  /** Optional; defaults by locale when omitted (saved / discovery map cards). */
  imageAttributionLabels?: PlaceImageAttributionLabels;
};

export function PlaceCard({
  place,
  locale,
  description,
  categoryLabel,
  categoryHref,
  cityLabel,
  returnPath,
  isAuthenticated,
  labels,
  imageAttributionLabels,
}: PlaceCardProps) {
  const t = useTranslations("places");
  const image = resolvePlaceImage(place);
  const mapCitySlug = place.city.slug?.trim() ?? "";
  const attributionLabels = imageAttributionLabels ?? attributionLabelsForLocale(locale);
  const ratingSummary = getPlaceDisplayRatingSummary(place);
  const ratingSourcesLine = formatPlaceRatingSourceCaption(locale, ratingSummary);
  const googlePlacesSnap = getGooglePlacesRatingSnapshotFromPlace(place);

  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="relative">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#f5f6f8]">
          <PlaceCoverImage
            src={image?.url ?? ""}
            alt={image?.altText ?? place.name}
            fallbackText={place.name}
            fallbackVisualKey={getPlaceImageFallbackKey(place)}
            showFallbackBadge={Boolean(image?.isFallback)}
            fallbackBadgeLabel={
              locale === "tr" ? "Yedek görsel" : "Fallback-Bild"
            }
          />
        </div>
        {image && placeImageAttributionHasContent(image) ? (
          <PlaceImageAttribution
            model={image}
            variant="compact"
            labels={attributionLabels}
          />
        ) : null}
        {place.verificationStatus === "VERIFIED" ? (
          <div className="absolute left-4 top-4">
            <PlaceTrustBadge
              status={place.verificationStatus}
              labels={{
                verified: labels.verified,
              }}
            />
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {categoryHref ? (
                  <Link
                    href={categoryHref}
                    className="underline-offset-2 hover:underline"
                  >
                    {categoryLabel}
                  </Link>
                ) : (
                  categoryLabel
                )}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                <Link href={`/places/${place.slug}`}>{place.name}</Link>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {place.city.slug ? (
                <Link
                  href={`/cities/${encodeURIComponent(place.city.slug)}`}
                  className="underline-offset-2 hover:underline"
                >
                  {cityLabel}
                </Link>
              ) : (
                cityLabel
              )}
            </span>
          </div>

          {ratingSummary ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                <span>
                  {ratingSummary.value.toFixed(1)} / 5
                </span>
                <span>({ratingSummary.count})</span>
              </div>
              {ratingSourcesLine ? (
                <p className="text-xs text-muted-foreground">{ratingSourcesLine}</p>
              ) : null}
              {googlePlacesSnap && !ratingSourcesLine ? (
                <p className="text-xs text-muted-foreground">
                  {t("card.googlePlacesRatingHint")}
                </p>
              ) : null}
            </div>
          ) : null}

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
                  href={buildDiscoveryMapPathForPlace(mapCitySlug, place.id)}
                  aria-label={t("card.showOnMap")}
                  title={t("card.showOnMap")}
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/places/${place.slug}`}>{labels.details}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
