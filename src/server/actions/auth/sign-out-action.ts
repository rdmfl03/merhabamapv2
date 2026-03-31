"use server";

import { signOut } from "@/auth";

function safeLocaleHome(locale: unknown): string {
  return locale === "tr" || locale === "de" ? `/${locale}` : "/de";
}

export async function signOutFromApp(formData: FormData) {
  const locale = formData.get("locale");
  await signOut({ redirectTo: safeLocaleHome(locale) });
}
