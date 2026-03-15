"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/permissions";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleAdminActionState: AdminActionState = {
  status: "idle",
};

export async function requireAdminAccess(locale: "de" | "tr") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/admin`)}`);
  }

  if (!canAccessAdmin(session.user.role)) {
    redirect(`/${locale}`);
  }

  return session.user;
}
