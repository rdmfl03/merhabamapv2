"use client";

import { useActionState, useEffect, useRef } from "react";

import { createEntityComment } from "@/server/actions/comments/create-entity-comment";
import {
  idleEntityCommentActionState,
  type EntityCommentActionState,
} from "@/server/actions/comments/entity-comment-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

const MAX_LEN = 500;

type EntityCommentFormProps = {
  entityType: "place" | "event";
  entityId: string;
  locale: "de" | "tr";
  returnPath: string;
  isAuthenticated: boolean;
  signInHref: string;
  labels: {
    placeholder: string;
    submit: string;
    signIn: string;
    counter: string;
    success: string;
    errorGeneric: string;
    errorValidation: string;
  };
};

export function EntityCommentForm({
  entityType,
  entityId,
  locale,
  returnPath,
  isAuthenticated,
  signInHref,
  labels,
}: EntityCommentFormProps) {
  const [state, formAction, pending] = useActionState(
    createEntityComment,
    idleEntityCommentActionState as EntityCommentActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  if (!isAuthenticated) {
    return (
      <Button variant="outline" asChild>
        <Link href={signInHref}>{labels.signIn}</Link>
      </Button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />

      <Textarea
        name="content"
        required
        maxLength={MAX_LEN}
        rows={3}
        placeholder={labels.placeholder}
        className="min-h-[5.5rem] resize-y rounded-2xl border-border text-sm"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{labels.counter.replace("{max}", String(MAX_LEN))}</span>
        <Button type="submit" size="sm" disabled={pending}>
          {labels.submit}
        </Button>
      </div>
      {state.status === "success" ? (
        <p className="text-xs text-muted-foreground">{labels.success}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-xs text-destructive" role="alert">
          {state.message === "validation_error" ? labels.errorValidation : labels.errorGeneric}
        </p>
      ) : null}
    </form>
  );
}
