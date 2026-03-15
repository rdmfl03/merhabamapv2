"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateClaimStatus } from "@/server/actions/admin/update-claim-status";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/state";

type ClaimStatusFormProps = {
  locale: "de" | "tr";
  claimId: string;
  labels: {
    approve: string;
    reject: string;
    success: string;
    error: string;
  };
};

export function ClaimStatusForm({
  locale,
  claimId,
  labels,
}: ClaimStatusFormProps) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updateClaimStatus,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="claimId" value={claimId} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="nextStatus" value="APPROVED">
          {labels.approve}
        </Button>
        <Button type="submit" name="nextStatus" value="REJECTED" variant="outline">
          {labels.reject}
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
