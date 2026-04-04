"use client";

import { useActionState } from "react";

import { AuthFormAlert } from "@/components/auth/auth-form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/server/actions/auth/request-password-reset";
import { idleAuthActionState } from "@/server/actions/auth/state";

type ForgotPasswordFormProps = {
  locale: "de" | "tr";
  email?: string;
  labels: {
    email: string;
    submit: string;
    success: string;
    error: string;
  };
};

export function ForgotPasswordForm({
  locale,
  email,
  labels,
}: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    idleAuthActionState,
  );

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft"
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={email}
        />
      </label>

      {state.status === "success" ? <AuthFormAlert variant="success">{labels.success}</AuthFormAlert> : null}
      {state.status === "error" ? <AuthFormAlert variant="error">{labels.error}</AuthFormAlert> : null}

      <Button className="w-full" type="submit" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
