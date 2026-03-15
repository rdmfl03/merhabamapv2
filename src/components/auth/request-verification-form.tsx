"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestEmailVerification } from "@/server/actions/auth/request-email-verification";
import { idleAuthActionState } from "@/server/actions/auth/state";

type RequestVerificationFormProps = {
  locale: "de" | "tr";
  email?: string;
  labels: {
    email: string;
    submit: string;
    success: string;
    error: string;
  };
};

export function RequestVerificationForm({
  locale,
  email,
  labels,
}: RequestVerificationFormProps) {
  const [state, formAction, pending] = useActionState(
    requestEmailVerification,
    idleAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <input type="hidden" name="locale" value={locale} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input type="email" name="email" required autoComplete="email" defaultValue={email} />
      </label>

      {state.status === "success" ? <p className="text-sm text-green-700">{labels.success}</p> : null}
      {state.status === "error" ? <p className="text-sm text-brand">{labels.error}</p> : null}

      <Button className="w-full" type="submit" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
