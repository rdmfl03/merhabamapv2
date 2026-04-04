import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { OnboardingEventsForm } from "@/components/onboarding/onboarding-events-form";
import { getEventImageFallbackKey } from "@/lib/category-fallback-visual";
import { getEventCategoryLabelKey } from "@/lib/events";
import { EVENT_CATEGORY_VALUES } from "@/lib/event-category-values";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import {
  parsePreferredEventCategories,
  parsePreferredPlaceCategoryIds,
} from "@/lib/user-onboarding-categories";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";

type OnboardingEventsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: OnboardingEventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return {
    title: t("eventsMetaTitle"),
    description: t("eventsMetaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function OnboardingEventsPage({ params }: OnboardingEventsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, tEvents, profile] = await Promise.all([
    getTranslations({ locale, namespace: "onboarding" }),
    getTranslations({ locale, namespace: "events" }),
    getCurrentUserProfile(user.id),
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

  const placeIds = parsePreferredPlaceCategoryIds(profile.preferredPlaceCategoryIdsJson);
  if (placeIds.length === 0) {
    redirect(`/${locale}/onboarding/places`);
  }

  const selectedEvents = parsePreferredEventCategories(
    profile.preferredEventCategoriesJson,
  );

  const eventCategories = EVENT_CATEGORY_VALUES.map((category) => ({
    value: category,
    label: tEvents(`categories.${getEventCategoryLabelKey(category)}`),
    visualKey: getEventImageFallbackKey(category),
  }));

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {t("eventsTitle")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("eventsDescription")}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("stepIndicator", { current: 3, total: 3 })}
        </p>
      </div>

      <OnboardingEventsForm
        locale={locale}
        eventCategories={eventCategories}
        selectedEventCategories={selectedEvents}
        labels={{
          backLink: t("backToPlaces"),
          eventCategoriesTitle: t("eventCategoriesTitle"),
          submit: t("finishOnboarding"),
          afterSubmitHint: t("afterSubmitHint"),
          success: t("success"),
          error: t("error"),
          errorEventCategoriesRequired: t("errorEventCategoriesRequired"),
          errorEventCategoriesTooMany: t("errorEventCategoriesTooMany"),
          errorEventCategoriesInvalid: t("errorEventCategoriesInvalid"),
          errorBasicsIncomplete: t("errorBasicsIncomplete"),
          errorPlacesStepIncomplete: t("errorPlacesStepIncomplete"),
          errorLocaleInvalid: t("errorLocaleInvalid"),
          errorSaveFailed: t("errorSaveFailed"),
        }}
      />
    </div>
  );
}
