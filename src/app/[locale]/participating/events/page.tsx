import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { EventCard } from "@/components/events/event-card";
import { Link } from "@/i18n/navigation";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { SavedEmptyState } from "@/components/saved/saved-empty-state";
import { auth } from "@/auth";
import { listUserUpcomingParticipatingEvents } from "@/server/queries/user/list-user-upcoming-participating-events";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "participating" });
  return {
    title: t("events.metaTitle"),
    description: t("events.metaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function ParticipatingEventsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/participating/events`)}`,
    );
  }

  const [t, tSaved, tEvents, events] = await Promise.all([
    getTranslations("participating"),
    getTranslations("saved"),
    getTranslations("events"),
    listUserUpcomingParticipatingEvents(session.user.id),
  ]);

  await trackProductInsight({
    name: "participating_events_view",
    payload: { locale, authenticated: true },
  });

  const returnPath = `/${locale}/participating/events`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("events.eyebrow")}</p>
        <h1 className="font-display text-4xl text-foreground">{t("events.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("events.description")}</p>
        <p className="text-xs text-muted-foreground">
          <Link href="/home" className="text-brand underline-offset-2 hover:underline">
            {t("events.backHome")}
          </Link>
        </p>
      </div>

      {events.length === 0 ? (
        <SavedEmptyState
          title={t("events.emptyTitle")}
          description={t("events.emptyDescription")}
          ctaLabel={t("events.cta")}
          href={`/${locale}/events`}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              locale={locale}
              description={getLocalizedEventText(
                { de: event.descriptionDe, tr: event.descriptionTr },
                locale,
                tSaved("events.fallbackDescription"),
              )}
              categoryLabel={tEvents(`categories.${getEventCategoryLabelKey(event.category)}`)}
              cityLabel={getLocalizedCityDisplayName(locale, event.city)}
              returnPath={returnPath}
              isAuthenticated
              labels={{
                details: tSaved("common.details"),
                save: tSaved("common.save"),
                saved: tSaved("common.saved"),
                saving: tSaved("common.saving"),
                signIn: tSaved("common.signIn"),
                external: tSaved("common.external"),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
