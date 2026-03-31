import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { CityFollowPanel } from "@/components/cities/city-follow-panel";
import { ActivityFeedItem, type ActivityFeedItemModel } from "@/components/social/activity-feed-item";
import { ProfileFollowButton } from "@/components/social/profile-follow-button";
import { PlaceCard } from "@/components/places/place-card";
import { SavedEmptyState } from "@/components/saved/saved-empty-state";
import { Button } from "@/components/ui/button";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { auth } from "@/auth";
import { getSavedPlaces } from "@/server/queries/user/get-saved-places";
import { getPublicUserByUsername } from "@/server/queries/social/get-public-user-by-username";
import {
  getFollowerCount,
  getFollowingCount,
} from "@/server/queries/social/follow-graph";
import { listPublicPlaceCollectionsByUser } from "@/server/queries/collections/list-public-place-collections-by-user";
import { getUserActivities } from "@/server/queries/social/get-user-activities";
import { isFollowing } from "@/server/queries/social/list-following-for-user";
import { listFollowedCitiesForUser } from "@/server/queries/cities/list-followed-cities-for-user";
import { countUserEntityContributions } from "@/server/queries/contributions/count-user-entity-contributions";
import { listUserContributedEvents } from "@/server/queries/contributions/list-user-contributed-events";
import { listUserContributedPlaces } from "@/server/queries/contributions/list-user-contributed-places";

type UserProfilePageProps = {
  params: Promise<{ locale: "de" | "tr"; username: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "userProfile" });
  const user = await getPublicUserByUsername(decodeURIComponent(username));
  if (!user?.username) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: t("metaTitle", { username: user.username }),
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { locale, username: usernameParam } = await params;
  setRequestLocale(locale);

  const decoded = decodeURIComponent(usernameParam);
  const profileUser = await getPublicUserByUsername(decoded);

  if (!profileUser?.username) {
    notFound();
  }

  const profileHandle = profileUser.username;

  const t = await getTranslations("userProfile");
  const tSaved = await getTranslations("saved");
  const tCities = await getTranslations("cities");

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const isOwnProfile = viewerId === profileUser.id;

  const [
    savedPlaces,
    activities,
    following,
    publicCollections,
    followerCount,
    followingCount,
    followedCities,
    contributionCounts,
    contributedPlaces,
    contributedEvents,
  ] = await Promise.all([
    isOwnProfile ? getSavedPlaces(profileUser.id) : Promise.resolve([]),
    getUserActivities(profileUser.id, locale),
    viewerId && viewerId !== profileUser.id
      ? isFollowing(viewerId, profileUser.id)
      : Promise.resolve(false),
    listPublicPlaceCollectionsByUser(profileUser.id),
    getFollowerCount(profileUser.id),
    getFollowingCount(profileUser.id),
    isOwnProfile ? listFollowedCitiesForUser(profileUser.id) : Promise.resolve([]),
    countUserEntityContributions(profileUser.id),
    isOwnProfile ? listUserContributedPlaces(profileUser.id) : Promise.resolve([]),
    isOwnProfile ? listUserContributedEvents(profileUser.id) : Promise.resolve([]),
  ]);

  const profileReturnPath = `/${locale}/user/${encodeURIComponent(profileHandle)}`;

  const userPath = encodeURIComponent(profileHandle);

  const activityItems: ActivityFeedItemModel[] = activities.map((row) => ({
    id: row.id,
    type: row.type,
    username: null,
    entity: row.entity,
    collectionTitle: row.collectionTitle,
    cityLabel: row.cityLabel,
    created_at: row.created_at,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("title")}</p>
            <h1 className="font-display text-4xl text-foreground">@{profileHandle}</h1>
            {profileUser.name ? (
              <p className="text-sm text-muted-foreground">{profileUser.name}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-border/60 py-3 text-sm">
            <Link
              href={`/user/${userPath}/followers`}
              className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
            >
              <span className="font-semibold tabular-nums">{followerCount}</span>
              <span className="text-muted-foreground">{t("statsFollowers")}</span>
            </Link>
            <Link
              href={`/user/${userPath}/following`}
              className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
            >
              <span className="font-semibold tabular-nums">{followingCount}</span>
              <span className="text-muted-foreground">{t("statsFollowing")}</span>
            </Link>
            <a
              href="#profile-collections"
              className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
            >
              <span className="font-semibold tabular-nums">{publicCollections.length}</span>
              <span className="text-muted-foreground">{t("statsPublicLists")}</span>
            </a>
            {isOwnProfile ? (
              <a
                href="#profile-saved"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{savedPlaces.length}</span>
                <span className="text-muted-foreground">{t("statsSavedPlaces")}</span>
              </a>
            ) : null}
            {contributionCounts.places > 0 ? (
              isOwnProfile ? (
                <a
                  href="#profile-contributed-places"
                  className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
                >
                  <span className="font-semibold tabular-nums">{contributionCounts.places}</span>
                  <span className="text-muted-foreground">{t("statsContributedPlaces")}</span>
                </a>
              ) : (
                <span className="inline-flex items-baseline gap-1.5 text-foreground">
                  <span className="font-semibold tabular-nums">{contributionCounts.places}</span>
                  <span className="text-muted-foreground">{t("statsContributedPlaces")}</span>
                </span>
              )
            ) : null}
            {contributionCounts.events > 0 ? (
              isOwnProfile ? (
                <a
                  href="#profile-contributed-events"
                  className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
                >
                  <span className="font-semibold tabular-nums">{contributionCounts.events}</span>
                  <span className="text-muted-foreground">{t("statsContributedEvents")}</span>
                </a>
              ) : (
                <span className="inline-flex items-baseline gap-1.5 text-foreground">
                  <span className="font-semibold tabular-nums">{contributionCounts.events}</span>
                  <span className="text-muted-foreground">{t("statsContributedEvents")}</span>
                </span>
              )
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {viewerId && !isOwnProfile ? (
            <ProfileFollowButton
              profileUserId={profileUser.id}
              initialFollowing={following}
              labels={{ follow: t("follow"), unfollow: t("unfollow") }}
            />
          ) : null}
          {!viewerId ? (
            <Button variant="outline" asChild>
              <Link href="/auth/signin">{t("signInToFollow")}</Link>
            </Button>
          ) : null}
          {isOwnProfile ? (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link href="/profile">{t("ownSettingsCta")}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {isOwnProfile ? (
        <section id="profile-followed-cities" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("followedCitiesEyebrow")}
            </p>
          </div>
          {followedCities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6">
              <p className="text-sm text-foreground">{t("followedCitiesEmpty")}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("followedCitiesHint")}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/map">{t("followedCitiesMapCta")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {followedCities.map((city) => (
                <li
                  key={city.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white/90 px-4 py-3 shadow-sm"
                >
                  <Link
                    href={`/cities/${encodeURIComponent(city.slug)}`}
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    {getLocalizedCityDisplayName(locale, city)}
                  </Link>
                  <CityFollowPanel
                    cityId={city.id}
                    locale={locale}
                    returnPath={profileReturnPath}
                    isFollowing
                    isAuthenticated={Boolean(viewerId)}
                    signInHref={`/auth/signin?next=${encodeURIComponent(profileReturnPath)}`}
                    labels={{
                      follow: tCities("cityFollow.follow", {
                        city: getLocalizedCityDisplayName(locale, city),
                      }),
                      unfollow: tCities("cityFollow.unfollow", {
                        city: getLocalizedCityDisplayName(locale, city),
                      }),
                      signIn: tCities("cityFollow.signIn"),
                      signUp: tCities("cityFollow.signUp"),
                      signInHint: tCities("cityFollow.signInHint"),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {isOwnProfile ? (
        <section id="profile-saved" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("savedEyebrow")}
            </p>
            <p className="text-xs text-muted-foreground">{t("savedHint")}</p>
          </div>
          {savedPlaces.length === 0 ? (
            <SavedEmptyState
              title={tSaved("places.emptyTitle")}
              description={tSaved("places.emptyDescription")}
              ctaLabel={tSaved("places.cta")}
              href="/places"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {savedPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  locale={locale}
                  description={getLocalizedText(
                    { de: place.descriptionDe, tr: place.descriptionTr },
                    locale,
                    tSaved("places.fallbackDescription"),
                  )}
                  categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                  cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                  returnPath={`/${locale}/user/${encodeURIComponent(profileHandle)}`}
                  isAuthenticated
                  labels={{
                    details: tSaved("common.details"),
                    save: tSaved("common.save"),
                    saved: tSaved("common.saved"),
                    saving: tSaved("common.saving"),
                    signIn: tSaved("common.signIn"),
                    verified: tSaved("common.verified"),
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section id="profile-collections" className="space-y-4 scroll-mt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("collectionsEyebrow")}
            </p>
            {isOwnProfile ? (
              <p className="text-xs text-muted-foreground">{t("collectionsEmptyOwn")}</p>
            ) : null}
          </div>
          {isOwnProfile ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/collections">{t("manageCollectionsCta")}</Link>
            </Button>
          ) : null}
        </div>
        {publicCollections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isOwnProfile ? t("collectionsEmptyOwn") : t("collectionsEmpty")}
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {publicCollections.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm">
                <Link
                  href={`/collections/${c.id}`}
                  className="font-semibold text-brand underline-offset-2 hover:underline"
                >
                  {c.title}
                </Link>
                {c.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                    {c.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("collectionItemCount", { n: c.itemCount })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isOwnProfile ? (
        <>
          <section id="profile-contributed-places" className="space-y-4 scroll-mt-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("contributionsPlacesEyebrow")}
              </p>
              <p className="text-xs text-muted-foreground">{t("contributionsPlacesHint")}</p>
            </div>
            {contributedPlaces.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                {t("contributionsEmptyPlaces")}
              </p>
            ) : (
              <ul className="space-y-2">
                {contributedPlaces.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/places/${encodeURIComponent(p.slug)}`}
                      className="font-medium text-brand underline-offset-2 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="profile-contributed-events" className="space-y-4 scroll-mt-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("contributionsEventsEyebrow")}
              </p>
              <p className="text-xs text-muted-foreground">{t("contributionsEventsHint")}</p>
            </div>
            {contributedEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                {t("contributionsEmptyEvents")}
              </p>
            ) : (
              <ul className="space-y-2">
                {contributedEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/events/${encodeURIComponent(e.slug)}`}
                      className="font-medium text-brand underline-offset-2 hover:underline"
                    >
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("activitiesEyebrow")}
        </p>
        {activityItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            —
          </p>
        ) : (
          <ul className="space-y-3">
            {activityItems.map((item) => (
              <ActivityFeedItem key={item.id} item={item} locale={locale} showActor={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
