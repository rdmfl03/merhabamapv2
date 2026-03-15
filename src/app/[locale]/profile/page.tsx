import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { interestValues, parseUserInterests } from "@/lib/user-preferences";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getActiveCities } from "@/server/queries/user/get-active-cities";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";

type ProfilePageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, profile, cities] = await Promise.all([
    getTranslations("profile"),
    getCurrentUserProfile(user.id),
    getActiveCities(),
  ]);

  if (!profile) {
    return null;
  }

  const interests = parseUserInterests(profile.interestsJson);
  const citySlug = profile.onboardingCity?.slug;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-xl font-semibold text-brand">
                {(profile.name ?? profile.email ?? "M").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {profile.name ?? t("fallbackName")}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{t("summary.language")}:</span>{" "}
                {profile.preferredLocale?.toUpperCase() ?? locale.toUpperCase()}
              </p>
              <p>
                <span className="font-medium text-foreground">{t("summary.city")}:</span>{" "}
                {profile.onboardingCity
                  ? locale === "tr"
                    ? profile.onboardingCity.nameTr
                    : profile.onboardingCity.nameDe
                  : t("summary.noCity")}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t("nextSteps.title")}</p>
              <div className="flex flex-col gap-2">
                <Link
                  href={citySlug ? `/places?city=${citySlug}` : "/places"}
                  className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
                >
                  {t("nextSteps.places")}
                </Link>
                <Link
                  href={citySlug ? `/events?city=${citySlug}` : "/events"}
                  className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
                >
                  {t("nextSteps.events")}
                </Link>
                <Link
                  href="/saved/places"
                  className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
                >
                  {t("nextSteps.saved")}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileForm
          locale={locale}
          profile={{
            name: profile.name,
            username: profile.username,
            email: profile.email,
            preferredLocale: profile.preferredLocale,
            cityId: profile.onboardingCity?.id,
            interests,
          }}
          cities={cities.map((city) => ({
            id: city.id,
            label: locale === "tr" ? city.nameTr : city.nameDe,
          }))}
          interests={interestValues.map((interest) => ({
            value: interest,
            label: t(`interests.${interest.toLowerCase()}`),
          }))}
          labels={{
            name: t("form.name"),
            username: t("form.username"),
            email: t("form.email"),
            language: t("form.language"),
            city: t("form.city"),
            interests: t("form.interests"),
            submit: t("form.submit"),
            success: t("form.success"),
            errors: {
              default: t("form.error"),
              validation: t("form.validationError"),
              usernameTaken: t("form.usernameTaken"),
            },
          }}
        />
      </div>
    </div>
  );
}
