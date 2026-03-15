"use server";

import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/validators/auth";

import { idleAuthActionState, type AuthActionState } from "./state";

export async function resetPassword(
  _previousState: AuthActionState = idleAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;

  const parsed = resetPasswordSchema.safeParse({
    locale: formData.get("locale"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message === "password_mismatch" ? "password_mismatch" : "validation_error",
    };
  }

  const result = await resetPasswordWithToken({
    token: parsed.data.token,
    password: parsed.data.password,
  });

  if (result !== "success") {
    return {
      status: "error",
      message: result,
    };
  }

  return {
    status: "success",
    message: "password_reset_success",
  };
}
