import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { PlaceCollectionMembershipRow } from "@/server/queries/collections/get-place-collection-membership-flags";

import { PlaceCollectionToggles } from "./place-collection-toggles";

type PlaceCollectionsPanelProps = {
  placeId: string;
  locale: "de" | "tr";
  returnPath: string;
  signInHref: string;
  isAuthenticated: boolean;
  membershipRows: PlaceCollectionMembershipRow[];
  labels: {
    title: string;
    emptyHint: string;
    manageLink: string;
    privateBadge: string;
    signIn: string;
    signInHint: string;
  };
};

export function PlaceCollectionsPanel({
  placeId,
  locale,
  returnPath,
  signInHref,
  isAuthenticated,
  membershipRows,
  labels,
}: PlaceCollectionsPanelProps) {
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-4">
        <p className="text-sm font-medium text-foreground">{labels.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.signInHint}</p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href={signInHref}>{labels.signIn}</Link>
        </Button>
      </div>
    );
  }

  return (
    <PlaceCollectionToggles
      placeId={placeId}
      locale={locale}
      returnPath={returnPath}
      rows={membershipRows}
      labels={{
        title: labels.title,
        emptyHint: labels.emptyHint,
        manageLink: labels.manageLink,
        privateBadge: labels.privateBadge,
      }}
    />
  );
}
