"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { updateEntityModerationStatus } from "@/server/actions/admin/update-entity-moderation-status";
import {
  idleAdminActionState,
  type AdminActionState,
} from "@/server/actions/admin/state";

type EntityModerationFormProps = {
  locale: "de" | "tr";
  entityType: "PLACE" | "EVENT";
  entityId: string;
  labels: {
    title: string;
    helper: string;
    approve: string;
    reject: string;
    rejectConfirm: string;
    rejectCancel: string;
    success: string;
    error: string;
    rejectConfirmationRequired: string;
  };
};

function SubmitButton({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: "APPROVED" | "REJECTED";
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" name="nextStatus" value={value} variant={variant} disabled={pending}>
      {label}
    </Button>
  );
}

function RejectToggleButtons({
  confirmReject,
  onConfirmReject,
  onCancelReject,
  labels,
}: {
  confirmReject: boolean;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  labels: {
    reject: string;
    rejectCancel: string;
  };
}) {
  const { pending } = useFormStatus();

  if (!confirmReject) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onConfirmReject}
        disabled={pending}
      >
        {labels.reject}
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" onClick={onCancelReject} disabled={pending}>
      {labels.rejectCancel}
    </Button>
  );
}

export function EntityModerationForm({
  locale,
  entityType,
  entityId,
  labels,
}: EntityModerationFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updateEntityModerationStatus,
    idleAdminActionState,
  );
  const [confirmReject, setConfirmReject] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setConfirmReject(false);
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

  const feedbackMessage =
    state.status === "error"
      ? state.message === "reject_confirmation_required"
        ? labels.rejectConfirmationRequired
        : labels.error
      : labels.success;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{labels.title}</h3>
        <p className="text-sm text-muted-foreground">{labels.helper}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton label={labels.approve} value="APPROVED" />
        {confirmReject ? (
          <>
            <input type="hidden" name="rejectConfirmation" value="confirmed" />
            <SubmitButton label={labels.rejectConfirm} value="REJECTED" variant="outline" />
            <RejectToggleButtons
              confirmReject={confirmReject}
              onConfirmReject={() => setConfirmReject(true)}
              onCancelReject={() => setConfirmReject(false)}
              labels={{
                reject: labels.reject,
                rejectCancel: labels.rejectCancel,
              }}
            />
          </>
        ) : (
          <RejectToggleButtons
            confirmReject={confirmReject}
            onConfirmReject={() => setConfirmReject(true)}
            onCancelReject={() => setConfirmReject(false)}
          labels={{
              reject: labels.reject,
              rejectCancel: labels.rejectCancel,
            }}
          />
        )}
      </div>

      {state.status === "success" ? (
        <p className="text-sm text-green-700">{feedbackMessage}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm text-brand">{feedbackMessage}</p>
      ) : null}
    </form>
  );
}
