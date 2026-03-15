"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updatePlaceTrustStatus } from "@/server/actions/admin/update-place-trust-status";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/shared";

type PlaceTrustStatusFormProps = {
  locale: "de" | "tr";
  placeId: string;
  labels: {
    unverified: string;
    claimed: string;
    verified: string;
    success: string;
    error: string;
  };
};

export function PlaceTrustStatusForm({
  locale,
  placeId,
  labels,
}: PlaceTrustStatusFormProps) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updatePlaceTrustStatus,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="placeId" value={placeId} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="nextStatus" value="UNVERIFIED" variant="outline">
          {labels.unverified}
        </Button>
        <Button type="submit" name="nextStatus" value="CLAIMED" variant="outline">
          {labels.claimed}
        </Button>
        <Button type="submit" name="nextStatus" value="VERIFIED">
          {labels.verified}
        </Button>
      </div>
      {state.status === "success" ? (
        <p className="text-sm text-green-700">{labels.success}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm text-brand">{labels.error}</p>
      ) : null}
    </form>
  );
}
