"use client";

import { useActionState } from "react";

import { submitPlaceCollectionReport } from "@/server/actions/reports/submit-place-collection-report";
import {
  idleSocialReportActionState,
  type SocialReportActionState,
} from "@/server/actions/reports/social-report-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type ReportReasonOption = { value: string; label: string };

type PlaceCollectionReportFormProps = {
  collectionId: string;
  locale: AppLocale;
  returnPath: string;
  isAuthenticated: boolean;
  signInHref: string;
  labels: {
    title: string;
    description: string;
    reasonLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    submit: string;
    signIn: string;
    success: string;
    error: string;
    cooldown: string;
    dailyLimit: string;
    trustFootnotePrefix: string;
    trustFootnoteLink: string;
    trustFootnoteSuffix: string;
  };
  reasons: ReportReasonOption[];
};

export function PlaceCollectionReportForm({
  collectionId,
  locale,
  returnPath,
  isAuthenticated,
  signInHref,
  labels,
  reasons,
}: PlaceCollectionReportFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPlaceCollectionReport,
    idleSocialReportActionState as SocialReportActionState,
  );

  return (
    <Card className="border-dashed border-border/80 bg-muted/10">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{labels.title}</h3>
          <p className="text-xs text-muted-foreground">{labels.description}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {labels.trustFootnotePrefix}
            <Link
              href="/community-rules"
              className="text-brand underline-offset-2 hover:underline"
            >
              {labels.trustFootnoteLink}
            </Link>
            {labels.trustFootnoteSuffix}
          </p>
        </div>

        {!isAuthenticated ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={signInHref}>{labels.signIn}</Link>
          </Button>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="collectionId" value={collectionId} />
            <input type="hidden" name="returnPath" value={returnPath} />

            <label className="block space-y-2 text-xs">
              <span className="font-medium text-foreground">{labels.reasonLabel}</span>
              <select
                name="reason"
                className="flex h-10 w-full rounded-2xl border border-border bg-white px-3 py-2 text-xs text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={reasons[0]?.value}
              >
                {reasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-xs">
              <span className="font-medium text-foreground">{labels.detailsLabel}</span>
              <Textarea
                name="details"
                placeholder={labels.detailsPlaceholder}
                maxLength={1000}
                className="min-h-[5rem] text-xs"
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
              <Button type="submit" size="sm" disabled={pending}>
                {labels.submit}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
