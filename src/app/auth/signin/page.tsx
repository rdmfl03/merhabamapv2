import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getLocaleFromCookieStore } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

export default async function RootSignInRedirectPage() {
  const cookieStore = await cookies();
  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  const locale =
    session?.user?.preferredLocale ??
    getLocaleFromCookieStore(cookieStore) ??
    routing.defaultLocale;

  redirect(`/${locale}/auth/signin`);
}
