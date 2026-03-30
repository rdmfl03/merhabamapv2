import type { AppLocale } from "@/i18n/routing";

export function guestAuthSignInHref(locale: AppLocale, returnPath: string): string {
  return `/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`;
}

export function guestAuthSignUpHref(locale: AppLocale, returnPath: string): string {
  return `/${locale}/auth/signup?next=${encodeURIComponent(returnPath)}`;
}

/** Derives signup URL from an existing sign-in URL built with the same `next` param. */
export function guestAuthSignUpHrefFromSignIn(signInHref: string): string {
  return signInHref.replace("/auth/signin", "/auth/signup");
}
