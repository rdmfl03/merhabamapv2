"use client";

import { useActionState } from "react";

import { AuthFormAlert } from "@/components/auth/auth-form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { registerUser } from "@/server/actions/auth/register-user";
import { idleAuthActionState } from "@/server/actions/auth/state";
import { cn } from "@/lib/utils";

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
    passwordTooShort: string;
    passwordTooLong: string;
    passwordNeedsUppercase: string;
    passwordNeedsLowercase: string;
    passwordNeedsNumber: string;
    emailInvalid: string;
    emailTooLong: string;
    nameTooLong: string;
    confirmPasswordTooShort: string;
    confirmPasswordTooLong: string;
    inviteCodeTooLong: string;
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
    case "password_too_short":
      return labels.passwordTooShort;
    case "password_too_long":
      return labels.passwordTooLong;
    case "password_needs_uppercase":
      return labels.passwordNeedsUppercase;
    case "password_needs_lowercase":
      return labels.passwordNeedsLowercase;
    case "password_needs_number":
      return labels.passwordNeedsNumber;
    case "email_invalid":
      return labels.emailInvalid;
    case "email_too_long":
      return labels.emailTooLong;
    case "name_too_long":
      return labels.nameTooLong;
    case "confirm_password_too_short":
      return labels.confirmPasswordTooShort;
    case "confirm_password_too_long":
      return labels.confirmPasswordTooLong;
    case "invite_code_too_long":
      return labels.inviteCodeTooLong;
    default:
      return labels.validationError;
  }
}

type RegistrationField = "name" | "email" | "inviteCode" | "password" | "confirmPassword";

function registrationErrorField(message: string | undefined): RegistrationField | null {
  switch (message) {
    case "email_invalid":
    case "email_too_long":
    case "email_in_use":
      return "email";
    case "name_too_long":
      return "name";
    case "invite_code_invalid":
    case "invite_code_too_long":
      return "inviteCode";
    case "password_too_short":
    case "password_too_long":
    case "password_needs_uppercase":
    case "password_needs_lowercase":
    case "password_needs_number":
      return "password";
    case "password_mismatch":
    case "confirm_password_too_short":
    case "confirm_password_too_long":
      return "confirmPassword";
    default:
      return null;
  }
}

const fieldErrorInputClass =
  "border-brand/45 ring-2 ring-brand/15 focus-visible:border-brand/55 focus-visible:ring-brand/25";

export function SignUpForm({ locale, labels, requireInviteCode = false }: SignUpFormProps) {
  const [state, formAction, pending] = useActionState(
    registerUser,
    idleAuthActionState,
  );

  const erroredField =
    state.status === "error" ? registrationErrorField(state.message) : null;

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft"
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.name}</span>
        <Input
          type="text"
          name="name"
          autoComplete="name"
          aria-invalid={erroredField === "name"}
          className={cn(erroredField === "name" && fieldErrorInputClass)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={erroredField === "email"}
          className={cn(erroredField === "email" && fieldErrorInputClass)}
        />
      </label>
      {requireInviteCode ? (
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-foreground">{labels.inviteCode}</span>
          <Input
            type="text"
            name="inviteCode"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={erroredField === "inviteCode"}
            className={cn(erroredField === "inviteCode" && fieldErrorInputClass)}
          />
          <span className="text-xs leading-5 text-muted-foreground">{labels.inviteCodeHint}</span>
        </label>
      ) : null}
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.password}</span>
        <Input
          type="password"
          name="password"
          autoComplete="new-password"
          aria-invalid={erroredField === "password"}
          className={cn(erroredField === "password" && fieldErrorInputClass)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.confirmPassword}</span>
        <Input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          aria-invalid={erroredField === "confirmPassword"}
          className={cn(erroredField === "confirmPassword" && fieldErrorInputClass)}
        />
      </label>

      {state.status !== "idle" ? (
        <AuthFormAlert variant={state.status === "success" ? "success" : "error"}>
          {getMessage(state.message, labels)}
        </AuthFormAlert>
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
