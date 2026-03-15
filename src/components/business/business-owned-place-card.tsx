import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceTrustBadge } from "@/components/places/place-trust-badge";

type BusinessOwnedPlaceCardProps = {
  locale: "de" | "tr";
  place: {
    id: string;
    slug: string;
    name: string;
    verificationStatus: "UNVERIFIED" | "CLAIMED" | "VERIFIED";
    city: {
      nameDe: string;
      nameTr: string;
    };
    lastBusinessUpdateAt?: Date | null;
  };
  labels: {
    city: string;
    manage: string;
    openPublic: string;
    claimed: string;
    verified: string;
    lastUpdated: string;
    notUpdated: string;
  };
};

export function BusinessOwnedPlaceCard({
  locale,
  place,
  labels,
}: BusinessOwnedPlaceCardProps) {
  const cityLabel = locale === "tr" ? place.city.nameTr : place.city.nameDe;

  return (
    <Card className="bg-white/90">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl text-foreground">{place.name}</h2>
            <PlaceTrustBadge
              status={place.verificationStatus}
              labels={{
                claimed: labels.claimed,
                verified: labels.verified,
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {labels.city}: {cityLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {labels.lastUpdated}:{" "}
            {place.lastBusinessUpdateAt
              ? place.lastBusinessUpdateAt.toLocaleDateString(locale)
              : labels.notUpdated}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/business/places/${place.id}`}>{labels.manage}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/places/${place.slug}`}>{labels.openPublic}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
