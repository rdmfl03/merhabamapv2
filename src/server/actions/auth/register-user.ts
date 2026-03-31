"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createAndSendEmailVerification } from "@/lib/auth/email-verification";
import {
  isInviteOnlyRegistrationEnabled,
  isSignupInviteCodeValid,
  isUserRegistrationEnabled,
} from "@/lib/auth/config";
import { registrationSchema } from "@/lib/validators/auth";

import { idleAuthActionState, type AuthActionState } from "./state";

export async function registerUser(
  _previousState: AuthActionState = idleAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;

  const registrationEnabled = isUserRegistrationEnabled();
  const inviteOnlyEnabled = isInviteOnlyRegistrationEnabled();

  if (!registrationEnabled && !inviteOnlyEnabled) {
    return {
      status: "error",
      message: "registration_disabled",
    };
  }

  const parsed = registrationSchema.safeParse({
    locale: formData.get("locale"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message === "password_mismatch" ? "password_mismatch" : "validation_error",
    };
  }

  if (inviteOnlyEnabled && !isSignupInviteCodeValid(parsed.data.inviteCode)) {
    return {
      status: "error",
      message: "invite_code_invalid",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "email_in_use",
    };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      hashedPassword: hashPassword(parsed.data.password),
      name: parsed.data.name,
      preferredLocale: parsed.data.locale,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (user.email) {
    await createAndSendEmailVerification({
      userId: user.id,
      email: user.email,
      locale: parsed.data.locale,
    });
  }

  return {
    status: "success",
    message: "registration_success",
  };
}
