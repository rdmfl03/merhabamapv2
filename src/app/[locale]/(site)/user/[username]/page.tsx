import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { CityFollowPanel } from "@/components/cities/city-follow-panel";
import { EventCard } from "@/components/events/event-card";
import { ActivityFeedItem, type ActivityFeedItemModel } from "@/components/social/activity-feed-item";
import { OwnProfileAvatarEditor } from "@/components/social/own-profile-avatar-editor";
import { OwnProfileBioEditor } from "@/components/social/own-profile-bio-editor";
import { ProfileFollowButton } from "@/components/social/profile-follow-button";
import { UserProfileAvatar } from "@/components/social/user-profile-avatar";
import { PlaceCard } from "@/components/places/place-card";
import { SavedEmptyState } from "@/components/saved/saved-empty-state";
import {
  ProfileSavedEventListRow,
  ProfileSavedPlaceListRow,
} from "@/components/social/profile-saved-list-rows";
import { ProfileSavedViewLinks } from "@/components/social/profile-saved-view-links";
import { Button } from "@/components/ui/button";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";
import { getEventCategoryLabelKey, getLocalizedEventText } from "@/lib/events";
import { auth } from "@/auth";
import { countSavedPlacesForUser, getSavedPlaces } from "@/server/queries/user/get-saved-places";
import { getPublicUserByUsername } from "@/server/queries/social/get-public-user-by-username";
import {
  getFollowerCount,
  getFollowingCount,
} from "@/server/queries/social/follow-graph";
import {
  countPublicPlaceCollectionsByUser,
  listPublicPlaceCollectionsByUser,
} from "@/server/queries/collections/list-public-place-collections-by-user";
import { getUserActivities } from "@/server/queries/social/get-user-activities";
import { isFollowing } from "@/server/queries/social/list-following-for-user";
import {
  getFollowedCityIdsForUser,
  listFollowedCitiesForUser,
} from "@/server/queries/cities/list-followed-cities-for-user";
import { countUserEntityContributions } from "@/server/queries/contributions/count-user-entity-contributions";
import { listUserContributedEvents } from "@/server/queries/contributions/list-user-contributed-events";
import { listUserContributedPlaces } from "@/server/queries/contributions/list-user-contributed-places";
import { countSavedEventsForUser, getSavedEvents } from "@/server/queries/user/get-saved-events";

type UserProfilePageProps = {
  params: Promise<{ locale: "de" | "tr"; username: string }>;
  searchParams: Promise<{ placesView?: string; eventsView?: string }>;
};

function parseProfileItemView(value: string | undefined): "grid" | "list" {
  return value === "grid" ? "grid" : "list";
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "userProfile" });
  const session = await auth();
  const user = await getPublicUserByUsername(decodeURIComponent(username), {
    viewerUserId: session?.user?.id ?? null,
  });
  if (!user?.username) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: t("metaTitle", { username: user.username }),
  };
}

export default async function UserProfilePage({ params, searchParams }: UserProfilePageProps) {
  const [{ locale, username: usernameParam }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const placesView = parseProfileItemView(sp.placesView);
  const eventsView = parseProfileItemView(sp.eventsView);

  const decoded = decodeURIComponent(usernameParam);
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const profileUser = await getPublicUserByUsername(decoded, {
    viewerUserId: viewerId,
  });

  if (!profileUser?.username) {
    notFound();
  }

  const profileHandle = profileUser.username;

  const t = await getTranslations("userProfile");
  const tSaved = await getTranslations("saved");
  const tCities = await getTranslations("cities");
  const tEvents = await getTranslations("events");

  const isOwnProfile = viewerId === profileUser.id;
  const limitedPreview = profileUser.limitedForPrivateViewer;
  const showExtended = !limitedPreview;
  const showActivities = isOwnProfile;

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
    savedEvents,
    viewerFollowedCityIds,
    savedPlacesCountPrivatePreview,
    savedEventsCountPrivatePreview,
    publicCollectionsCountPrivatePreview,
  ] = await Promise.all([
    showExtended ? getSavedPlaces(profileUser.id) : Promise.resolve([]),
    showActivities ? getUserActivities(profileUser.id, locale) : Promise.resolve([]),
    viewerId && !isOwnProfile ? isFollowing(viewerId, profileUser.id) : Promise.resolve(false),
    showExtended ? listPublicPlaceCollectionsByUser(profileUser.id) : Promise.resolve([]),
    getFollowerCount(profileUser.id),
    getFollowingCount(profileUser.id),
    showExtended ? listFollowedCitiesForUser(profileUser.id) : Promise.resolve([]),
    showExtended ? countUserEntityContributions(profileUser.id) : Promise.resolve({ places: 0, events: 0 }),
    isOwnProfile ? listUserContributedPlaces(profileUser.id) : Promise.resolve([]),
    isOwnProfile ? listUserContributedEvents(profileUser.id) : Promise.resolve([]),
    showExtended ? getSavedEvents(profileUser.id) : Promise.resolve([]),
    showExtended && viewerId ? getFollowedCityIdsForUser(viewerId) : Promise.resolve([]),
    limitedPreview ? countSavedPlacesForUser(profileUser.id) : Promise.resolve(0),
    limitedPreview ? countSavedEventsForUser(profileUser.id) : Promise.resolve(0),
    limitedPreview ? countPublicPlaceCollectionsByUser(profileUser.id) : Promise.resolve(0),
  ]);

  const viewerFollowedCityIdSet = new Set(viewerFollowedCityIds);
  const savedPlacesStatCount = limitedPreview ? savedPlacesCountPrivatePreview : savedPlaces.length;
  const savedEventsStatCount = limitedPreview
    ? savedEventsCountPrivatePreview
    : savedEvents.length;
  const publicListsStatCount = limitedPreview ? publicCollectionsCountPrivatePreview : publicCollections.length;

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
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {isOwnProfile ? (
          <OwnProfileAvatarEditor
            locale={locale}
            username={profileHandle}
            name={profileUser.name}
            imageUrl={profileUser.image}
            editAriaLabel={t("avatarEditAria")}
            errorLabels={{
              default: t("avatarErrors.default"),
              missing: t("avatarErrors.missing"),
              tooLarge: t("avatarErrors.tooLarge"),
              invalid: t("avatarErrors.invalid"),
              saveFailed: t("avatarErrors.saveFailed"),
            }}
          />
        ) : (
          <UserProfileAvatar
            imageUrl={profileUser.image}
            name={profileUser.name}
            username={profileHandle}
            size="lg"
            className="shrink-0 sm:mt-1"
          />
        )}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("title")}</p>
            <h1 className="font-display text-4xl text-foreground">@{profileHandle}</h1>
            {profileUser.name ? (
              <p className="text-base font-medium text-foreground">{profileUser.name}</p>
            ) : null}
            {isOwnProfile ? (
              <OwnProfileBioEditor
                locale={locale}
                initialBio={profileUser.bio}
                labels={{
                  sectionLabel: t("bioSectionLabel"),
                  emptyHint: t("bioEmptyOwn"),
                  edit: t("bioEdit"),
                  save: t("bioSave"),
                  cancel: t("bioCancel"),
                  success: t("bioSaveSuccess"),
                  error: t("bioSaveError"),
                }}
              />
            ) : profileUser.bio ? (
              <div className="max-w-xl space-y-1">
                <p className="text-sm font-medium text-foreground">{t("bioSectionLabel")}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{profileUser.bio}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-border/60 py-3 text-sm">
            {limitedPreview ? (
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{followerCount}</span>
                <span>{t("statsFollowers")}</span>
              </span>
            ) : (
              <Link
                href={`/user/${userPath}/followers`}
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{followerCount}</span>
                <span className="text-muted-foreground">{t("statsFollowers")}</span>
              </Link>
            )}
            {limitedPreview ? (
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{followingCount}</span>
                <span>{t("statsFollowing")}</span>
              </span>
            ) : (
              <Link
                href={`/user/${userPath}/following`}
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{followingCount}</span>
                <span className="text-muted-foreground">{t("statsFollowing")}</span>
              </Link>
            )}
            {limitedPreview ? (
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{publicListsStatCount}</span>
                <span>{t("statsPublicLists")}</span>
              </span>
            ) : isOwnProfile ? (
              <Link
                href={
                  publicListsStatCount > 0 ? "#profile-collections" : "/collections"
                }
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{publicListsStatCount}</span>
                <span className="text-muted-foreground">{t("statsPublicLists")}</span>
              </Link>
            ) : publicListsStatCount > 0 ? (
              <a
                href="#profile-collections"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{publicListsStatCount}</span>
                <span className="text-muted-foreground">{t("statsPublicLists")}</span>
              </a>
            ) : (
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums">0</span>
                <span>{t("statsPublicLists")}</span>
              </span>
            )}
            {!limitedPreview && isOwnProfile ? (
              <a
                href="#profile-saved"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{savedPlacesStatCount}</span>
                <span className="text-muted-foreground">{t("statsSavedPlaces")}</span>
              </a>
            ) : null}
            {!limitedPreview && !isOwnProfile ? (
              <a
                href="#profile-saved"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{savedPlacesStatCount}</span>
                <span className="text-muted-foreground">{t("statsSavedPlaces")}</span>
              </a>
            ) : null}
            {limitedPreview ? (
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{savedEventsStatCount}</span>
                <span>{t("statsParticipatingEvents")}</span>
              </span>
            ) : isOwnProfile ? (
              <a
                href="#profile-saved-events"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{savedEventsStatCount}</span>
                <span className="text-muted-foreground">{t("statsParticipatingEvents")}</span>
              </a>
            ) : (
              <a
                href="#profile-saved-events"
                className="inline-flex items-baseline gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <span className="font-semibold tabular-nums">{savedEventsStatCount}</span>
                <span className="text-muted-foreground">{t("statsParticipatingEvents")}</span>
              </a>
            )}
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

        {(viewerId && !isOwnProfile) || !viewerId ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:pt-1">
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
          </div>
        ) : null}
      </div>

      {showExtended ? (
        <section id="profile-followed-cities" className="space-y-4 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {isOwnProfile ? t("followedCitiesEyebrow") : t("followedCitiesEyebrowVisitor")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwnProfile ? t("followedCitiesHint") : t("followedCitiesHintVisitor")}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-auto" asChild>
              <Link href="/map">{t("followedCitiesMapCta")}</Link>
            </Button>
          </div>
          {followedCities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6">
              <p className="text-sm text-foreground">{t("followedCitiesEmpty")}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/90 shadow-sm">
              <ul className="divide-y divide-border/70">
                {followedCities.map((city) => (
                  <li
                    key={city.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
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
                      isFollowing={isOwnProfile ? true : viewerFollowedCityIdSet.has(city.id)}
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
            </div>
          )}
        </section>
      ) : null}

      {showExtended ? (
        <section id="profile-saved" className="space-y-4 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("savedEyebrow")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwnProfile ? t("savedHint") : t("savedHintVisitor")}
              </p>
            </div>
            {savedPlaces.length > 0 ? (
              <ProfileSavedViewLinks
                variant="places"
                placesView={placesView}
                eventsView={eventsView}
                profileHandle={profileHandle}
                labels={{
                  grid: t("viewModeGrid"),
                  list: t("viewModeList"),
                  groupPlaces: t("viewModeGroupPlaces"),
                  groupEvents: t("viewModeGroupEvents"),
                }}
              />
            ) : null}
          </div>
          {savedPlaces.length === 0 ? (
            <SavedEmptyState
              title={tSaved("places.emptyTitle")}
              description={tSaved("places.emptyDescription")}
              ctaLabel={tSaved("places.cta")}
              href="/places"
            />
          ) : placesView === "list" ? (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/90 shadow-sm">
              <ul className="divide-y divide-border/70">
                {savedPlaces.map((place) => (
                  <ProfileSavedPlaceListRow
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
                    returnPath={profileReturnPath}
                    isAuthenticated={Boolean(viewerId)}
                    signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(profileReturnPath)}`}
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
              </ul>
            </div>
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
                  returnPath={profileReturnPath}
                  isAuthenticated={Boolean(viewerId)}
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

      {showExtended ? (
        <section id="profile-saved-events" className="space-y-4 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("participatingEventsEyebrow")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwnProfile ? t("participatingEventsHint") : t("participatingEventsHintVisitor")}
              </p>
            </div>
            {savedEvents.length > 0 ? (
              <ProfileSavedViewLinks
                variant="events"
                placesView={placesView}
                eventsView={eventsView}
                profileHandle={profileHandle}
                labels={{
                  grid: t("viewModeGrid"),
                  list: t("viewModeList"),
                  groupPlaces: t("viewModeGroupPlaces"),
                  groupEvents: t("viewModeGroupEvents"),
                }}
              />
            ) : null}
          </div>
          {savedEvents.length === 0 ? (
            <SavedEmptyState
              title={tSaved("events.emptyTitle")}
              description={tSaved("events.emptyDescription")}
              ctaLabel={tSaved("events.cta")}
              href="/events"
            />
          ) : eventsView === "list" ? (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/90 shadow-sm">
              <ul className="divide-y divide-border/70">
                {savedEvents.map((event) => (
                  <ProfileSavedEventListRow
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
                    returnPath={profileReturnPath}
                    isAuthenticated={Boolean(viewerId)}
                    signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(profileReturnPath)}`}
                    labels={{
                      details: tSaved("common.details"),
                      save: tSaved("common.save"),
                      saved: tSaved("common.saved"),
                      saving: tSaved("common.saving"),
                      signIn: tSaved("common.signIn"),
                    }}
                  />
                ))}
              </ul>
            </div>
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
                    tSaved("events.fallbackDescription"),
                  )}
                  categoryLabel={tEvents(`categories.${getEventCategoryLabelKey(event.category)}`)}
                  cityLabel={getLocalizedCityDisplayName(locale, event.city)}
                  returnPath={profileReturnPath}
                  isAuthenticated={Boolean(viewerId)}
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
        </section>
      ) : null}

      {showExtended && publicCollections.length > 0 ? (
        <section id="profile-collections" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("collectionsEyebrow")}
            </p>
            {isOwnProfile ? (
              <p className="text-xs text-muted-foreground">{t("collectionsEmptyOwn")}</p>
            ) : null}
          </div>
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
        </section>
      ) : null}

      {isOwnProfile && contributedPlaces.length > 0 ? (
        <section id="profile-contributed-places" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("contributionsPlacesEyebrow")}
            </p>
            <p className="text-xs text-muted-foreground">{t("contributionsPlacesHint")}</p>
          </div>
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
        </section>
      ) : null}

      {isOwnProfile && contributedEvents.length > 0 ? (
        <section id="profile-contributed-events" className="space-y-4 scroll-mt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("contributionsEventsEyebrow")}
            </p>
            <p className="text-xs text-muted-foreground">{t("contributionsEventsHint")}</p>
          </div>
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
        </section>
      ) : null}

      {showActivities ? (
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
      ) : null}
    </div>
  );
}
