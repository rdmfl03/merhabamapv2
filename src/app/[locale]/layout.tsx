import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { isAppLocale, routing } from "@/i18n/routing";

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
  const [messages, footerT, commonT, legalT] = await Promise.all([
    getMessages(),
    getTranslations("footer"),
    getTranslations("common"),
    getTranslations("legal"),
  ]);
  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }
  const needsOnboarding =
    Boolean(session?.user?.id) && !session?.user?.onboardingCompletedAt;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <OnboardingGuard needsOnboarding={needsOnboarding} locale={locale}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">{children}</main>
          <Footer
            tagline={footerT("tagline")}
            navAriaLabel={footerT("navAriaLabel")}
            essentialNotice={footerT("essentialNotice")}
            copyright={footerT("copyright")}
            citiesLabel={commonT("cities")}
            placesLabel={commonT("places")}
            eventsLabel={commonT("events")}
            signUpLabel={commonT("signUp")}
            impressumLabel={legalT("navigation.impressum")}
            privacyLabel={legalT("navigation.privacy")}
            contactLabel={legalT("navigation.contact")}
            cookiesLabel={legalT("navigation.cookies")}
            termsLabel={legalT("navigation.terms")}
            communityRulesLabel={legalT("navigation.communityRules")}
          />
        </div>
      </OnboardingGuard>
    </NextIntlClientProvider>
  );
}
