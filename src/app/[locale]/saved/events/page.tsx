import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventCard } from "@/components/events/event-card";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { SavedEmptyState } from "@/components/saved/saved-empty-state";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getSavedEvents } from "@/server/queries/user/get-saved-events";

type SavedEventsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: SavedEventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saved" });
  return {
    title: t("events.title"),
    description: t("events.description"),
    robots: robotsNoIndex,
  };
}

export default async function SavedEventsPage({ params }: SavedEventsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, eventTexts, savedEvents] = await Promise.all([
    getTranslations("saved"),
    getTranslations("events"),
    getSavedEvents(user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("events.eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-foreground">{t("events.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("events.description")}</p>
      </div>

      {savedEvents.length === 0 ? (
        <SavedEmptyState
          title={t("events.emptyTitle")}
          description={t("events.emptyDescription")}
          ctaLabel={t("events.cta")}
          href={`/${locale}/events`}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {savedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              locale={locale}
              description={getLocalizedEventText(
                { de: event.descriptionDe, tr: event.descriptionTr },
                locale,
                t("events.fallbackDescription"),
              )}
              categoryLabel={eventTexts(`categories.${getEventCategoryLabelKey(event.category)}`)}
              cityLabel={getLocalizedCityDisplayName(locale, event.city)}
              returnPath={`/${locale}/saved/events`}
              isAuthenticated
              labels={{
                details: t("common.details"),
                save: t("common.save"),
                saved: t("common.saved"),
                saving: t("common.saving"),
                signIn: t("common.signIn"),
                external: t("common.external"),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
