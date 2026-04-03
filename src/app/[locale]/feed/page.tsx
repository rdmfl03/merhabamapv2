import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { ActivityFeedItem } from "@/components/social/activity-feed-item";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFollowedCityIdsForUser } from "@/server/queries/cities/list-followed-cities-for-user";
import { FeedDiscoveryBlocks } from "@/components/feed/feed-discovery-blocks";
import { FeedReturnHints } from "@/components/feed/feed-return-hints";
import { getFeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";
import { getFeedActivities, type FeedMode } from "@/server/queries/social/get-feed-activities";
import { getUnreadNotificationCount } from "@/server/queries/notifications/get-unread-notification-count";

import type { Metadata } from "next";

import { robotsNoIndex } from "@/lib/seo/robots-meta";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

export const dynamic = "force-dynamic";

type FeedPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<{ mode?: string | string[] }>;
};

function parseMode(raw: string | string[] | undefined): FeedMode {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "local" ? "local" : "default";
}

export async function generateMetadata({ params }: FeedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feed" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: robotsNoIndex,
  };
}

export default async function FeedPage({ params, searchParams }: FeedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const mode = parseMode((await searchParams).mode);

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const feedReturnPath = `/${locale}/feed${mode === "local" ? "?mode=local" : ""}`;

  if (!viewerId) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(feedReturnPath)}`);
  }

  const [t, followedCityIds, items, discovery, unreadNotifications] = await Promise.all([
    getTranslations("feed"),
    getFollowedCityIdsForUser(viewerId),
    getFeedActivities(viewerId, { locale, mode }),
    getFeedDiscoveryBundle({ locale, mode, viewerUserId: viewerId }),
    getUnreadNotificationCount(viewerId),
  ]);

  const hasFollowedCitiesForLocal = followedCityIds.length > 0;

  await trackProductInsight({
    name: "feed_view",
    payload: {
      locale,
      authenticated: Boolean(viewerId),
      feedMode: mode,
    },
  });

  const subtitle =
    mode === "local"
      ? t("subtitleLocal")
      : t("subtitlePersonalized");

  const renderEmpty = () => {
    if (mode === "local") {
      if (!hasFollowedCitiesForLocal) {
        return (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{t("emptyLocal")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("emptyLocalHint")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button variant="default" asChild>
                <Link href="/map">{t("emptyLocalCtaMap")}</Link>
              </Button>
            </div>
          </div>
        );
      }
      return (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">{t("emptyLocal")}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("emptyLocalHint")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/map">{t("emptyLocalCtaMap")}</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">{t("empty")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("emptyHint")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="default" asChild>
            <Link href="/places">{t("emptyCtaPlaces")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("emptyCtaFollow")}</Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div
          className="inline-flex gap-1 rounded-xl border border-border/80 bg-muted/25 p-1"
          role="tablist"
          aria-label={t("title")}
        >
          <Link
            href="/feed"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "default"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            scroll={false}
          >
            {t("tabForYou")}
          </Link>
          <Link
            href="/feed?mode=local"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "local"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            scroll={false}
          >
            {t("tabMyCities")}
          </Link>
        </div>

        <FeedReturnHints
          mode={mode}
          hasFollowedCities={followedCityIds.length > 0}
          unreadNotifications={unreadNotifications}
        />
      </div>

      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ActivityFeedItem key={item.id} item={item} locale={locale} showActor />
          ))}
        </ul>
      )}

      <FeedDiscoveryBlocks locale={locale} discovery={discovery} />
    </div>
  );
}
