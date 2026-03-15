"use server";

import { resendVerificationForEmail } from "@/lib/auth/email-verification";
import { requestEmailVerificationSchema } from "@/lib/validators/auth";

import { idleAuthActionState, type AuthActionState } from "./state";

export async function requestEmailVerification(
  _previousState: AuthActionState = idleAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;

  const parsed = requestEmailVerificationSchema.safeParse({
    locale: formData.get("locale"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "validation_error",
    };
  }

  await resendVerificationForEmail({
    email: parsed.data.email,
    locale: parsed.data.locale,
  });

  return {
    status: "success",
    message: "verification_requested",
  };
}
