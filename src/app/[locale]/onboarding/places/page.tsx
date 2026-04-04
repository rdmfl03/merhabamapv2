import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { OnboardingPlacesForm } from "@/components/onboarding/onboarding-places-form";
import {
  getOrderedPlaceCategoryVisualGroups,
  visualGroupKeyForPlaceSlug,
} from "@/lib/place-category-onboarding-groups";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import {
  parsePreferredPlaceCategoryIds,
} from "@/lib/user-onboarding-categories";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";

type OnboardingPlacesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: OnboardingPlacesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return {
    title: t("placesMetaTitle"),
    description: t("placesMetaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function OnboardingPlacesPage({ params }: OnboardingPlacesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, profile, placeSlugRows] = await Promise.all([
    getTranslations({ locale, namespace: "onboarding" }),
    getCurrentUserProfile(user.id),
    prisma.placeCategory.findMany({
      select: { id: true, slug: true },
    }),
  ]);

  if (profile?.onboardingCompletedAt) {
    redirect(
      profile.username
        ? `/${locale}/user/${profile.username}`
        : `/${locale}/home`,
    );
  }

  if (!profile?.username || !profile?.onboardingCity?.id) {
    redirect(`/${locale}/onboarding`);
  }

  const selectedPlaceIds = parsePreferredPlaceCategoryIds(
    profile.preferredPlaceCategoryIdsJson,
  );

  const idToSlug = new Map(placeSlugRows.map((row) => [row.id, row.slug]));
  const selectedPlaceGroupKeys = new Set<string>();
  for (const id of selectedPlaceIds) {
    const slug = idToSlug.get(id);
    const key = visualGroupKeyForPlaceSlug(slug ?? null);
    if (key) {
      selectedPlaceGroupKeys.add(key);
    }
  }

  const placeCategoryGroups = getOrderedPlaceCategoryVisualGroups().map(({ key }) => ({
    value: key,
    label: t(`placeVisualGroup.${key}`),
  }));

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {t("placesTitle")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("placesDescription")}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("stepIndicator", { current: 2, total: 3 })}
        </p>
      </div>

      <OnboardingPlacesForm
        locale={locale}
        placeCategoryGroups={placeCategoryGroups}
        selectedPlaceCategoryGroups={[...selectedPlaceGroupKeys]}
        labels={{
          backLink: t("backToBasics"),
          placeCategoriesTitle: t("placeCategoriesTitle"),
          submit: t("continueToEvents"),
          afterSubmitHint: t("afterSubmitPlacesHint"),
          success: t("placesStepSaved"),
          error: t("error"),
          errorPlaceCategoriesRequired: t("errorPlaceCategoriesRequired"),
          errorPlaceCategoriesTooMany: t("errorPlaceCategoriesTooMany"),
          errorPlaceCategoriesInvalid: t("errorPlaceCategoriesInvalid"),
          errorBasicsIncomplete: t("errorBasicsIncomplete"),
          errorLocaleInvalid: t("errorLocaleInvalid"),
          errorSaveFailed: t("errorSaveFailed"),
        }}
      />
    </div>
  );
}
