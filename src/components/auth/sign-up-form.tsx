"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { registerUser } from "@/server/actions/auth/register-user";
import { idleAuthActionState } from "@/server/actions/auth/state";

type SignUpFormProps = {
  locale: "de" | "tr";
  requireInviteCode?: boolean;
  labels: {
    name: string;
    email: string;
    inviteCode: string;
    inviteCodeHint: string;
    password: string;
    confirmPassword: string;
    submit: string;
    success: string;
    validationError: string;
    emailInUse: string;
    passwordMismatch: string;
    inviteCodeInvalid: string;
    registrationDisabled: string;
    legalAcknowledgementPrefix: string;
    legalAcknowledgementTerms: string;
    legalAcknowledgementConnector: string;
    legalAcknowledgementPrivacy: string;
    legalAcknowledgementSuffix: string;
  };
};

function getMessage(message: string | undefined, labels: SignUpFormProps["labels"]) {
  switch (message) {
    case "registration_success":
      return labels.success;
    case "email_in_use":
      return labels.emailInUse;
    case "password_mismatch":
      return labels.passwordMismatch;
    case "invite_code_invalid":
      return labels.inviteCodeInvalid;
    case "registration_disabled":
      return labels.registrationDisabled;
    default:
      return labels.validationError;
  }
}

export function SignUpForm({ locale, labels, requireInviteCode = false }: SignUpFormProps) {
  const [state, formAction, pending] = useActionState(
    registerUser,
    idleAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <input type="hidden" name="locale" value={locale} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.name}</span>
        <Input type="text" name="name" autoComplete="name" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input type="email" name="email" required autoComplete="email" />
      </label>
      {requireInviteCode ? (
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-foreground">{labels.inviteCode}</span>
          <Input type="text" name="inviteCode" required autoComplete="off" spellCheck={false} />
          <span className="text-xs leading-5 text-muted-foreground">{labels.inviteCodeHint}</span>
        </label>
      ) : null}
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.password}</span>
        <Input type="password" name="password" required autoComplete="new-password" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.confirmPassword}</span>
        <Input type="password" name="confirmPassword" required autoComplete="new-password" />
      </label>

      {state.status !== "idle" ? (
        <p className={`text-sm ${state.status === "success" ? "text-green-700" : "text-brand"}`}>
          {getMessage(state.message, labels)}
        </p>
      ) : null}

      <Button className="w-full" type="submit" disabled={pending}>
        {labels.submit}
      </Button>

      <p className="text-xs leading-6 text-muted-foreground">
        {labels.legalAcknowledgementPrefix}{" "}
        <Link href="/terms" className="font-medium text-brand">
          {labels.legalAcknowledgementTerms}
        </Link>{" "}
        {labels.legalAcknowledgementConnector}{" "}
        <Link href="/privacy" className="font-medium text-brand">
          {labels.legalAcknowledgementPrivacy}
        </Link>
        {labels.legalAcknowledgementSuffix}
      </p>
    </form>
  );
}
