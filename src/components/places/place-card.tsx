import { MapPin } from "lucide-react";

import { PlaceSaveButton } from "@/components/places/place-save-button";
import { PlaceTrustBadge } from "@/components/places/place-trust-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getPlaceImage, getVerificationTone } from "@/lib/places";
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
    claimed: string;
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
  const image = getPlaceImage(place.images);
  const verificationTone = getVerificationTone(place.verificationStatus);

  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="relative">
        <div className="flex h-44 items-center justify-center bg-brand-soft">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={place.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft via-white to-brand-soft text-sm font-medium text-brand">
              {place.name}
            </div>
          )}
        </div>
        {verificationTone === "verified" || verificationTone === "claimed" ? (
          <div className="absolute left-4 top-4">
            <PlaceTrustBadge
              status={place.verificationStatus}
              labels={{
                claimed: labels.claimed,
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
