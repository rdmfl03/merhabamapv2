import { getTranslations, setRequestLocale } from "next-intl/server";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getActiveCities } from "@/server/queries/user/get-active-cities";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { interestValues, parseUserInterests } from "@/lib/user-preferences";

type OnboardingPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, cities, profile] = await Promise.all([
    getTranslations("onboarding"),
    getActiveCities(),
    getCurrentUserProfile(user.id),
  ]);

  const selectedInterests = parseUserInterests(profile?.interestsJson);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <OnboardingForm
        locale={locale}
        currentLocale={profile?.preferredLocale ?? locale}
        cities={cities.map((city) => ({
          id: city.id,
          slug: city.slug,
          label: getLocalizedCityDisplayName(locale, city),
        }))}
        interests={interestValues.map((interest) => ({
          value: interest,
          label: t(`interests.${interest.toLowerCase()}`),
        }))}
        selectedInterests={selectedInterests}
        selectedCityId={profile?.onboardingCity?.id}
        labels={{
          languageTitle: t("languageTitle"),
          cityTitle: t("cityTitle"),
          interestsTitle: t("interestsTitle"),
          submit: t("submit"),
          success: t("success"),
          error: t("error"),
        }}
      />

      {selectedInterests.length > 0 ? (
        <div className="rounded-[1.75rem] border border-border bg-white/90 p-6 shadow-soft">
          <p className="text-sm font-medium text-foreground">{t("existingSelections")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedInterests.map((interest) => t(`interests.${interest.toLowerCase()}`)).join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
