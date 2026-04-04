import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { Link } from "@/i18n/navigation";
import { isAppLocale, routing } from "@/i18n/routing";

const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

/**
 * Next.js does not pass route `params` into `not-found.tsx` the same way as page components.
 * Prefer the middleware header; avoid `getLocale()` here (it can resolve before `setRequestLocale` in layouts).
 */
export default async function UserProfileNotFound() {
  const headerLocale = (await headers()).get(NEXT_INTL_LOCALE_HEADER);
  const locale =
    headerLocale && isAppLocale(headerLocale) ? headerLocale : routing.defaultLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "userProfile" });

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="font-display text-2xl text-foreground">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFoundBody")}</p>
      <Link href="/map" className="inline-block text-sm font-semibold text-brand hover:underline">
        ← MerhabaMap
      </Link>
    </div>
  );
}
