import { Button } from "@/components/ui/button";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { guestAuthSignUpHrefFromSignIn } from "@/lib/auth/guest-auth-links";
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
    signUp: string;
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
    const signUpHref = guestAuthSignUpHrefFromSignIn(signInHref);
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-4">
        <p className="text-sm font-medium text-foreground">{labels.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.signInHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <GuestCtaInsightLink href={signInHref} locale={locale} surface="collections_panel" ctaType="signin">
              {labels.signIn}
            </GuestCtaInsightLink>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
            <GuestCtaInsightLink href={signUpHref} locale={locale} surface="collections_panel" ctaType="signup">
              {labels.signUp}
            </GuestCtaInsightLink>
          </Button>
        </div>
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
