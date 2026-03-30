"use client";

import { useActionState } from "react";

import { submitEntityCommentReport } from "@/server/actions/reports/submit-entity-comment-report";
import {
  idleSocialReportActionState,
  type SocialReportActionState,
} from "@/server/actions/reports/social-report-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AppLocale } from "@/i18n/routing";

type ReportReasonOption = { value: string; label: string };

type EntityCommentReportControlProps = {
  commentId: string;
  locale: AppLocale;
  returnPath: string;
  labels: {
    action: string;
    title: string;
    description: string;
    reasonLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    submit: string;
    success: string;
    error: string;
    cooldown: string;
    dailyLimit: string;
  };
  reasons: ReportReasonOption[];
};

export function EntityCommentReportControl({
  commentId,
  locale,
  returnPath,
  labels,
  reasons,
}: EntityCommentReportControlProps) {
  const [state, formAction, pending] = useActionState(
    submitEntityCommentReport,
    idleSocialReportActionState as SocialReportActionState,
  );

  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer select-none text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
        {labels.action}
      </summary>
      <div className="mt-3 space-y-3 rounded-xl border border-border/70 bg-muted/15 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{labels.title}</p>
          <p className="text-xs text-muted-foreground">{labels.description}</p>
        </div>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="commentId" value={commentId} />
          <input type="hidden" name="returnPath" value={returnPath} />

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground">{labels.reasonLabel}</span>
            <select
              name="reason"
              className="flex h-9 w-full rounded-xl border border-border bg-white px-3 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={reasons[0]?.value}
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground">{labels.detailsLabel}</span>
            <Textarea
              name="details"
              placeholder={labels.detailsPlaceholder}
              maxLength={1000}
              className="min-h-[4rem] text-xs"
            />
          </label>

          {state.status === "success" ? (
            <p className="text-xs text-green-700">{labels.success}</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-xs text-brand" role="alert">
              {state.message === "report_cooldown"
                ? labels.cooldown
                : state.message === "report_daily_limit"
                  ? labels.dailyLimit
                  : labels.error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {labels.submit}
            </Button>
          </div>
        </form>
      </div>
    </details>
  );
}
