"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { applyAiModerationAction } from "@/server/actions/admin/ai-moderation-actions";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/state";

type AiReviewActionFormProps = {
  locale: "de" | "tr";
  entityType: "event" | "place";
  entityId: string;
  labels: {
    approve: string;
    review: string;
    reject: string;
    rerun: string;
    error: string;
  };
};

export function AiReviewActionForm({
  locale,
  entityType,
  entityId,
  labels,
}: AiReviewActionFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    applyAiModerationAction,
    idleAdminActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="action" value="OK" size="sm" disabled={pending}>
          {labels.approve}
        </Button>
        <Button type="submit" name="action" value="REVIEW" size="sm" variant="outline" disabled={pending}>
          {labels.review}
        </Button>
        <Button type="submit" name="action" value="REJECT" size="sm" variant="outline" disabled={pending}>
          {labels.reject}
        </Button>
        <Button type="submit" name="action" value="RERUN" size="sm" variant="ghost" disabled={pending}>
          {labels.rerun}
        </Button>
      </div>
      {state.status === "error" ? (
        <p className="text-xs text-brand">{labels.error}</p>
      ) : null}
    </form>
  );
}
