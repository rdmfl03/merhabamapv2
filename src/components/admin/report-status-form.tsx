"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateReportStatus } from "@/server/actions/admin/update-report-status";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/shared";

type ReportStatusFormProps = {
  locale: "de" | "tr";
  reportId: string;
  labels: {
    inReview: string;
    resolve: string;
    reject: string;
    success: string;
    error: string;
  };
};

function ActionButton({
  label,
  value,
}: {
  label: string;
  value: "IN_REVIEW" | "RESOLVED" | "REJECTED";
}) {
  return (
    <Button type="submit" name="nextStatus" value={value} variant="outline">
      {label}
    </Button>
  );
}

export function ReportStatusForm({
  locale,
  reportId,
  labels,
}: ReportStatusFormProps) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updateReportStatus,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="reportId" value={reportId} />
      <div className="flex flex-wrap gap-3">
        <ActionButton label={labels.inReview} value="IN_REVIEW" />
        <ActionButton label={labels.resolve} value="RESOLVED" />
        <ActionButton label={labels.reject} value="REJECTED" />
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
