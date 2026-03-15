"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/server/actions/auth/reset-password";
import { idleAuthActionState } from "@/server/actions/auth/state";

type ResetPasswordFormProps = {
  locale: "de" | "tr";
  token: string;
  labels: {
    password: string;
    confirmPassword: string;
    submit: string;
    success: string;
    error: string;
    mismatch: string;
  };
};

export function ResetPasswordForm({
  locale,
  token,
  labels,
}: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    idleAuthActionState,
  );

  const message =
    state.message === "password_mismatch"
      ? labels.mismatch
      : state.status === "success"
        ? labels.success
        : state.status === "error"
          ? labels.error
          : null;

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.password}</span>
        <Input type="password" name="password" required autoComplete="new-password" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.confirmPassword}</span>
        <Input type="password" name="confirmPassword" required autoComplete="new-password" />
      </label>

      {message ? (
        <p className={`text-sm ${state.status === "success" ? "text-green-700" : "text-brand"}`}>
          {message}
        </p>
      ) : null}

      <Button className="w-full" type="submit" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
