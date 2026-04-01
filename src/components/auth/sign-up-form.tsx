"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { registerUser } from "@/server/actions/auth/register-user";
import { idleAuthActionState } from "@/server/actions/auth/state";

type SignUpFormProps = {
  locale: "de" | "tr";
  requireInviteCode?: boolean;
  labels: {
    name: string;
    email: string;
    language: string;
    password: string;
    confirmPassword: string;
    inviteCode: string;
    inviteCodeHint: string;
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

export function SignUpForm({ locale, requireInviteCode = false, labels }: SignUpFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerUser,
    idleAuthActionState,
  );
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state.status === "success" && email.trim()) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(email.trim())}&created=1`);
    }
  }, [email, router, state.status]);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <input type="hidden" name="locale" value={locale} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.name}</span>
        <Input type="text" name="name" autoComplete="name" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.language}</span>
        <select
          name="preferredLocale"
          defaultValue={locale}
          className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="de">Deutsch</option>
          <option value="tr">Türkçe</option>
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.password}</span>
        <Input type="password" name="password" required autoComplete="new-password" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.confirmPassword}</span>
        <Input type="password" name="confirmPassword" required autoComplete="new-password" />
      </label>
      {requireInviteCode ? (
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-foreground">{labels.inviteCode}</span>
          <Input type="text" name="inviteCode" required autoComplete="off" />
          <p className="text-xs leading-5 text-muted-foreground">{labels.inviteCodeHint}</p>
        </label>
      ) : null}

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
