import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoggedInHome } from "@/components/home/logged-in-home";
import { listFollowedCitiesForUser } from "@/server/queries/cities/list-followed-cities-for-user";
import { countUserEntityContributions } from "@/server/queries/contributions/count-user-entity-contributions";
import { getFeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";
import { sliceDiscoveryForHome } from "@/server/queries/discovery/slice-discovery-for-home";
import { getUnreadNotificationCount } from "@/server/queries/notifications/get-unread-notification-count";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { computeActivationFocus } from "@/lib/user/compute-activation-focus";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";
import { countUserUpcomingParticipations } from "@/server/queries/user/count-user-upcoming-participations";
import { getUserActivationSignals } from "@/server/queries/user/get-user-activation-signals";
import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type HomePageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/home`)}`);
  }

  if (!session?.user?.onboardingCompletedAt) {
    redirect(`/${locale}/onboarding`);
  }

  const profile = await getCurrentUserProfile(userId);
  if (!profile) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/home`)}`);
  }

  const displayName =
    profile.name?.trim() ||
    (profile.username?.trim() ? `@${profile.username.trim()}` : null) ||
    profile.email?.split("@")[0] ||
    "—";

  const [
    unreadNotifications,
    followedCities,
    discoveryFull,
    contributionCounts,
    activationSignals,
    upcomingParticipations,
  ] = await Promise.all([
    getUnreadNotificationCount(userId),
    listFollowedCitiesForUser(userId),
    getFeedDiscoveryBundle({
      locale,
      mode: "default",
      viewerUserId: userId,
    }),
    countUserEntityContributions(userId),
    getUserActivationSignals(userId),
    countUserUpcomingParticipations(userId),
  ]);

  const discovery = sliceDiscoveryForHome(discoveryFull);
  const activationFocus = computeActivationFocus(activationSignals);
  const onboardingCityLabel = profile.onboardingCity
    ? getLocalizedCityDisplayName(locale, profile.onboardingCity)
    : null;

  await trackProductInsight({
    name: "home_view",
    payload: { locale, authenticated: true },
  });

  return (
    <LoggedInHome
      locale={locale}
      displayName={displayName}
      username={profile.username?.trim() ?? null}
      onboardingCitySlug={profile.onboardingCity?.slug ?? null}
      onboardingCityLabel={onboardingCityLabel}
      activationFocus={activationFocus}
      activationSignals={activationSignals}
      unreadNotifications={unreadNotifications}
      upcomingParticipationsCount={upcomingParticipations}
      followedCities={followedCities}
      discovery={discovery}
      contributionPlaces={contributionCounts.places}
      contributionEvents={contributionCounts.events}
    />
  );
}
