import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { ProfileNavLocaleProvider } from "@/components/i18n/profile-nav-locale-context";
import { isAppLocale, routing, type AppLocale } from "@/i18n/routing";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  /** Explicit `locale` avoids relying on request-locale resolution order (Header/Footer run in nested layouts). */
  const messages = await getMessages({ locale });
  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }
  const needsOnboarding =
    Boolean(session?.user?.id) && !session?.user?.onboardingCompletedAt;

  const profileNavLocale: AppLocale | null =
    session?.user?.id != null
      ? session.user.preferredLocale === "de" || session.user.preferredLocale === "tr"
        ? session.user.preferredLocale
        : routing.defaultLocale
      : null;

  const navigationBaseLocale: AppLocale = profileNavLocale ?? locale;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ProfileNavLocaleProvider value={profileNavLocale}>
        <OnboardingGuard
          needsOnboarding={needsOnboarding}
          locale={locale}
          navigationBaseLocale={navigationBaseLocale}
        >
          <div className="min-h-screen">{children}</div>
        </OnboardingGuard>
      </ProfileNavLocaleProvider>
    </NextIntlClientProvider>
  );
}
