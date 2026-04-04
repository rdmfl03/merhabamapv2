import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileAvatarSettings } from "@/components/profile/profile-avatar-settings";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserProfileAvatar } from "@/components/social/user-profile-avatar";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { interestValues, parseUserInterests } from "@/lib/user-preferences";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getGermanCitiesForForms } from "@/server/queries/user/get-german-cities-for-forms";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";

type ProfilePageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return {
    title: t("title"),
    description: t("description"),
    robots: robotsNoIndex,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, profile, cities] = await Promise.all([
    getTranslations("profile"),
    getCurrentUserProfile(user.id),
    getGermanCitiesForForms(),
  ]);

  if (!profile) {
    return null;
  }

  const interests = parseUserInterests(profile.interestsJson);
  const citySlug = profile.onboardingCity?.slug;
  const avatarHandle =
    profile.username?.trim() ||
    profile.email?.split("@")[0]?.trim() ||
    "user";

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
              <UserProfileAvatar
                imageUrl={profile.image}
                name={profile.name}
                username={avatarHandle}
                size="md"
              />
              <div>
                <p className="font-semibold text-foreground">
                  {profile.name ?? t("fallbackName")}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <ProfileAvatarSettings
              locale={locale}
              username={avatarHandle}
              name={profile.name}
              imageUrl={profile.image}
              labels={{
                title: t("avatar.title"),
                hint: t("avatar.hint"),
                chooseFile: t("avatar.chooseFile"),
                remove: t("avatar.remove"),
                successUpload: t("avatar.successUpload"),
                successClear: t("avatar.successClear"),
                errors: {
                  default: t("avatar.errors.default"),
                  missing: t("avatar.errors.missing"),
                  tooLarge: t("avatar.errors.tooLarge"),
                  invalid: t("avatar.errors.invalid"),
                  saveFailed: t("avatar.errors.saveFailed"),
                },
              }}
            />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{t("summary.language")}:</span>{" "}
                {profile.preferredLocale?.toUpperCase() ?? locale.toUpperCase()}
              </p>
              <p>
                <span className="font-medium text-foreground">{t("summary.city")}:</span>{" "}
                {profile.onboardingCity
                  ? getLocalizedCityDisplayName(locale, profile.onboardingCity)
                  : t("summary.noCity")}
              </p>
            </div>
            {profile.username?.trim() ? (
              <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/25 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  {t("publicProfileSectionTitle")}
                </p>
                <p className="text-xs text-muted-foreground">{t("publicProfileSectionBody")}</p>
                <Link
                  href={`/user/${encodeURIComponent(profile.username.trim())}`}
                  className="inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
                >
                  {t("viewPublicProfile")}
                </Link>
              </div>
            ) : null}
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
            profileVisibility: profile.profileVisibility,
            bio: profile.profileBio,
          }}
          cities={cities.map((city) => ({
            id: city.id,
            label: getLocalizedCityDisplayName(locale, city),
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
            profileVisibility: t("form.profileVisibility"),
            profileVisibilityPublic: t("form.profileVisibilityPublic"),
            profileVisibilityPrivate: t("form.profileVisibilityPrivate"),
            profileVisibilityHint: t("form.profileVisibilityHint"),
            bio: t("form.bio"),
            bioHint: t("form.bioHint"),
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
