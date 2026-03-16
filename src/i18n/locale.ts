import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { isAppLocale, routing, type AppLocale } from "@/i18n/routing";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (isAppLocale(maybeLocale)) {
    const stripped = `/${segments.slice(2).join("/")}`;
    return stripped === "/" ? "/" : stripped.replace(/\/+$/, "") || "/";
  }

  return pathname || "/";
}

export function getLocaleFromCookieStore(
  cookieStore: Pick<ReadonlyRequestCookies, "get">,
) {
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isAppLocale(cookieValue) ? cookieValue : routing.defaultLocale;
}

export function buildLocalizedPath(locale: AppLocale, pathname: string) {
  const strippedPath = stripLocalePrefix(pathname);
  return strippedPath === "/" ? `/${locale}` : `/${locale}${strippedPath}`;
}
