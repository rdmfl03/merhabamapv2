import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLocaleFromCookieStore } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

export default async function RootSignInRedirectPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookieStore(cookieStore) ?? routing.defaultLocale;

  redirect(`/${locale}/auth/signin`);
}
