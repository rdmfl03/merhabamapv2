"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

type OnboardingGuardProps = {
  children: React.ReactNode;
  needsOnboarding?: boolean;
  locale?: "de" | "tr";
};

export function OnboardingGuard({
  children,
  needsOnboarding = false,
  locale = "de",
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
      `/${locale}/saved`,
    ];

    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      router.replace("/onboarding");
    }
  }, [locale, needsOnboarding, pathname, router]);

  return children;
}
