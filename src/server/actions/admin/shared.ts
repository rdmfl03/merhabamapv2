import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/permissions";

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
