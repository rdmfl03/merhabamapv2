import { MapPin, Star } from "lucide-react";

import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge } from "@/components/places/place-trust-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  computeRatingConfidence,
  getPlaceDisplayRatingSummary,
  resolvePlaceImage,
} from "@/lib/places";
import type { ListedPlace } from "@/server/queries/places/list-places";

type PlaceCardProps = {
  place: ListedPlace;
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
    verified: string;
  };
};

export function PlaceCard({
  place,
  locale,
  description,
  categoryLabel,
  cityLabel,
  returnPath,
  isAuthenticated,
  labels,
}: PlaceCardProps) {
  const image = resolvePlaceImage(place);
  const ratingSummary = getPlaceDisplayRatingSummary(place);
  const ratingConfidence = computeRatingConfidence(place);
  const ratingConfidenceLabel =
    ratingConfidence.level === "high"
      ? locale === "tr"
        ? "Cok sayida degerlendirme"
        : "Sehr viele Bewertungen"
      : ratingConfidence.level === "medium"
        ? locale === "tr"
          ? "Populer"
          : "Beliebt"
        : locale === "tr"
          ? "Az degerlendirme"
          : "Wenige Bewertungen";

  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="relative">
        <div className="flex h-44 items-center justify-center bg-[#f5f6f8]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText ?? place.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5f6f8] via-white to-[#eef1f5] text-sm font-medium text-brand">
              {place.name}
            </div>
          )}
        </div>
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
        {image?.isFallback ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
            {locale === "tr" ? "Fallback gorsel" : "Fallback-Bild"}
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {categoryLabel}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                <Link href={`/places/${place.slug}`}>{place.name}</Link>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{cityLabel}</span>
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
              <p className="text-xs text-muted-foreground">{ratingConfidenceLabel}</p>
            </div>
          ) : null}

          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <PlaceSaveButton
            placeId={place.id}
            locale={locale}
            returnPath={returnPath}
            isSaved={place.isSaved}
            isAuthenticated={isAuthenticated}
            signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`}
            labels={{
              save: labels.save,
              saved: labels.saved,
              saving: labels.saving,
              signIn: labels.signIn,
            }}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/places/${place.slug}`}>{labels.details}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
