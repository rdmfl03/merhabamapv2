"use client";

import { useActionState } from "react";

import { submitPlaceReport } from "@/server/actions/places/submit-place-report";
import { idlePlaceActionState } from "@/server/actions/places/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

type PlaceReportFormProps = {
  placeId: string;
  locale: "de" | "tr";
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
    reasons: Array<{ value: string; label: string }>;
  };
};

export function PlaceReportForm({
  placeId,
  locale,
  returnPath,
  isAuthenticated,
  signInHref,
  labels,
}: PlaceReportFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPlaceReport,
    idlePlaceActionState,
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{labels.title}</h3>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
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
          <Button variant="outline" asChild>
            <Link href={signInHref}>{labels.signIn}</Link>
          </Button>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="placeId" value={placeId} />
            <input type="hidden" name="returnPath" value={returnPath} />

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.reasonLabel}</span>
              <select
                name="reason"
                className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={labels.reasons[0]?.value}
              >
                {labels.reasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.detailsLabel}</span>
              <Textarea
                name="details"
                placeholder={labels.detailsPlaceholder}
                maxLength={1000}
              />
            </label>

            {state.status === "success" ? (
              <p className="text-sm text-green-700">{labels.success}</p>
            ) : null}
            {state.status === "error" ? (
              <p className="text-sm text-brand">
                {state.message === "report_cooldown"
                  ? labels.cooldown
                  : state.message === "report_daily_limit"
                    ? labels.dailyLimit
                    : labels.error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {labels.submit}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
