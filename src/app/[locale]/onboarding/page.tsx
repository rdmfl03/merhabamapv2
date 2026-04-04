import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { OnboardingBasicsForm } from "@/components/onboarding/onboarding-basics-form";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getGermanCitiesForForms } from "@/server/queries/user/get-german-cities-for-forms";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";

type OnboardingPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: OnboardingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, cities, profile] = await Promise.all([
    getTranslations({ locale, namespace: "onboarding" }),
    getGermanCitiesForForms(),
    getCurrentUserProfile(user.id),
  ]);

  if (profile?.onboardingCompletedAt) {
    redirect(
      profile.username
        ? `/${locale}/user/${profile.username}`
        : `/${locale}/home`,
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("stepIndicator", { current: 1, total: 3 })}
        </p>
      </div>

      <OnboardingBasicsForm
        locale={locale}
        defaultPreferredLocale={profile?.preferredLocale ?? locale}
        cities={cities.map((city) => ({
          id: city.id,
          slug: city.slug,
          label: getLocalizedCityDisplayName(locale, city),
        }))}
        selectedCityId={profile?.onboardingCity?.id}
        defaultUsername={profile?.username}
        labels={{
          languageTitle: t("languageTitle"),
          languageDescription: t("languageDescription"),
          usernameTitle: t("usernameTitle"),
          usernameHint: t("usernameHint"),
          usernamePlaceholder: t("usernamePlaceholder"),
          usernameAvailableHint: t("usernameAvailableHint"),
          usernameChecking: t("usernameChecking"),
          cityTitle: t("cityTitle"),
          submit: t("continueToPlaces"),
          afterSubmitHint: t("afterSubmitBasicsHint"),
          success: t("basicsSaved"),
          error: t("error"),
          errorUsernameTaken: t("errorUsernameTaken"),
          errorUsernameInvalid: t("errorUsernameInvalid"),
          errorCityInvalid: t("errorCityInvalid"),
          errorLocaleInvalid: t("errorLocaleInvalid"),
          errorSaveFailed: t("errorSaveFailed"),
        }}
      />
    </div>
  );
}
