"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { reviewNormalizedIngestEvent } from "@/server/actions/admin/review-normalized-ingest-event";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/state";

type StagedIngestEventReviewFormProps = {
  locale: "de" | "tr";
  normalizedIngestEventId: string;
  labels: {
    title: string;
    helper: string;
    reviewNote: string;
    promote: string;
    reject: string;
    markDuplicate: string;
    markStale: string;
    markSuperseded: string;
    success: string;
    error: string;
  };
};

export function StagedIngestEventReviewForm({
  locale,
  normalizedIngestEventId,
  labels,
}: StagedIngestEventReviewFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    reviewNormalizedIngestEvent,
    idleAdminActionState,
  );
  const [, startRefreshTransition] = useTransition();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      startRefreshTransition(() => {
        router.refresh();
      });
    }, 700);

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="normalizedIngestEventId" value={normalizedIngestEventId} />

      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{labels.title}</p>
        <p className="text-sm text-muted-foreground">{labels.helper}</p>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels.reviewNote}
        </span>
        <textarea
          name="reviewNote"
          rows={3}
          maxLength={500}
          className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-brand"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="action" value="PROMOTE">
          {labels.promote}
        </Button>
        <Button type="submit" name="action" value="MARK_DUPLICATE" variant="outline">
          {labels.markDuplicate}
        </Button>
        <Button type="submit" name="action" value="MARK_STALE" variant="outline">
          {labels.markStale}
        </Button>
        <Button type="submit" name="action" value="MARK_SUPERSEDED" variant="outline">
          {labels.markSuperseded}
        </Button>
        <Button type="submit" name="action" value="REJECT" variant="outline">
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
