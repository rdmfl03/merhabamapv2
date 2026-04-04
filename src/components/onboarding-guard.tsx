"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

type OnboardingGuardProps = {
  children: React.ReactNode;
  needsOnboarding?: boolean;
  /** Current URL `[locale]` segment (for path checks). */
  locale?: "de" | "tr";
  /**
   * Locale prefix for enforced redirects (e.g. onboarding). Use profile preferred locale when logged in
   * so temporary UI language does not keep onboarding on the wrong locale.
   */
  navigationBaseLocale?: "de" | "tr";
};

export function OnboardingGuard({
  children,
  needsOnboarding = false,
  locale = "de",
  navigationBaseLocale = locale,
}: OnboardingGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!needsOnboarding) {
      return;
    }

    const allowedPrefixes = [
      `/${locale}/onboarding`,
      `/${locale}/auth`,
      `/${locale}/admin`,
      `/${locale}/business`,
      `/${locale}/profile`,
      `/${locale}/user`,
      `/${locale}/saved`,
    ];

    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      router.replace("/onboarding", { locale: navigationBaseLocale });
    }
  }, [locale, navigationBaseLocale, needsOnboarding, pathname, router]);

  return children;
}
