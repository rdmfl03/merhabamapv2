"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { createEntityComment } from "@/server/actions/comments/create-entity-comment";
import { resolveSocialGuardMessage } from "@/lib/social/social-guard-ui";
import {
  idleEntityCommentActionState,
  type EntityCommentActionState,
} from "@/server/actions/comments/entity-comment-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { guestAuthSignUpHrefFromSignIn } from "@/lib/auth/guest-auth-links";
import { ENTITY_COMMENT_MAX_LENGTH } from "@/lib/validators/comments";

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
  const tGuard = useTranslations("socialSafety");
  const tGuest = useTranslations("guestConversion");
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
    const signUpHref = guestAuthSignUpHrefFromSignIn(signInHref);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <GuestCtaInsightLink href={signInHref} locale={locale} surface="comment_form" ctaType="signin">
            {labels.signIn}
          </GuestCtaInsightLink>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
          <GuestCtaInsightLink href={signUpHref} locale={locale} surface="comment_form" ctaType="signup">
            {tGuest("signUp")}
          </GuestCtaInsightLink>
        </Button>
      </div>
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
        maxLength={ENTITY_COMMENT_MAX_LENGTH}
        rows={3}
        placeholder={labels.placeholder}
        className="min-h-[5.5rem] resize-y rounded-2xl border-border text-sm"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{labels.counter}</span>
        <Button type="submit" size="sm" disabled={pending}>
          {labels.submit}
        </Button>
      </div>
      {state.status === "success" ? (
        <p className="text-xs text-muted-foreground">{labels.success}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-xs text-destructive" role="alert">
          {state.message === "validation_error"
            ? labels.errorValidation
            : resolveSocialGuardMessage(state.message, (k) => tGuard(k)) ?? labels.errorGeneric}
        </p>
      ) : null}
    </form>
  );
}
