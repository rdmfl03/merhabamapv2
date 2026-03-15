import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireAuthenticatedUser(locale: "de" | "tr") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin`);
  }

  return session.user;
}
