import { BadgeCheck, ShieldCheck, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type PlaceTrustBadgeProps = {
  status: "UNVERIFIED" | "CLAIMED" | "VERIFIED";
  labels: {
    claimed: string;
    verified: string;
  };
};

export function PlaceTrustBadge({ status, labels }: PlaceTrustBadgeProps) {
  if (status === "VERIFIED") {
    return (
      <Badge className="gap-1">
        <BadgeCheck className="h-3.5 w-3.5" />
        {labels.verified}
      </Badge>
    );
  }

  if (status === "CLAIMED") {
    return (
      <Badge className="gap-1 bg-white text-foreground">
        <Store className="h-3.5 w-3.5" />
        {labels.claimed}
      </Badge>
    );
  }

  return null;
}

type PlaceTrustHelperProps = {
  status: "UNVERIFIED" | "CLAIMED" | "VERIFIED";
  labels: {
    claimedTitle: string;
    claimedDescription: string;
    verifiedTitle: string;
    verifiedDescription: string;
  };
};

export function PlaceTrustHelper({ status, labels }: PlaceTrustHelperProps) {
  if (status === "VERIFIED") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-emerald-900">
          <ShieldCheck className="h-4 w-4" />
          {labels.verifiedTitle}
        </p>
        <p className="mt-1 text-emerald-800">{labels.verifiedDescription}</p>
      </div>
    );
  }

  if (status === "CLAIMED") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-amber-900">
          <Store className="h-4 w-4" />
          {labels.claimedTitle}
        </p>
        <p className="mt-1 text-amber-800">{labels.claimedDescription}</p>
      </div>
    );
  }

  return null;
}
