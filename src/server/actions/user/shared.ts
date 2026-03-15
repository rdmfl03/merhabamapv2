"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type UserFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleUserFormState: UserFormState = {
  status: "idle",
};

export async function requireAuthenticatedUser(locale: "de" | "tr") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin`);
  }

  return session.user;
}
