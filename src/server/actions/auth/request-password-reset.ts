"use server";

import { createAndSendPasswordReset } from "@/lib/auth/password-reset";
import { requestPasswordResetSchema } from "@/lib/validators/auth";

import { idleAuthActionState, type AuthActionState } from "./state";

export async function requestPasswordReset(
  _previousState: AuthActionState = idleAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;

  const parsed = requestPasswordResetSchema.safeParse({
    locale: formData.get("locale"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "validation_error",
    };
  }

  await createAndSendPasswordReset({
    email: parsed.data.email,
    locale: parsed.data.locale,
  });

  return {
    status: "success",
    message: "password_reset_requested",
  };
}
