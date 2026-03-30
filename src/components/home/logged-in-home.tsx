import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { formatEventDateRange } from "@/lib/events";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import type { FollowedCityRow } from "@/server/queries/cities/list-followed-cities-for-user";
import type { ActivationFocus } from "@/lib/user/compute-activation-focus";
import type { FeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";
import type { UserActivationSignals } from "@/server/queries/user/get-user-activation-signals";

type LoggedInHomeProps = {
  locale: AppLocale;
  displayName: string;
  username: string | null;
  onboardingCitySlug: string | null;
  onboardingCityLabel: string | null;
  activationFocus: ActivationFocus;
  activationSignals: UserActivationSignals;
  unreadNotifications: number;
  upcomingParticipationsCount: number;
  followedCities: FollowedCityRow[];
  discovery: FeedDiscoveryBundle;
  contributionPlaces: number;
  contributionEvents: number;
};

export async function LoggedInHome({
  locale,
  displayName,
  username,
  onboardingCitySlug,
  onboardingCityLabel,
  activationFocus,
  activationSignals,
  unreadNotifications,
  upcomingParticipationsCount,
  followedCities,
  discovery,
  contributionPlaces,
  contributionEvents,
}: LoggedInHomeProps) {
  const t = await getTranslations("home");
  const hasDiscovery =
    discovery.places.length > 0 ||
    discovery.events.length > 0 ||
    discovery.collections.length > 0;

  const mapHref = onboardingCitySlug
    ? `/map?city=${encodeURIComponent(onboardingCitySlug)}`
    : "/map";

  const placesHref = onboardingCitySlug
    ? `/places?city=${encodeURIComponent(onboardingCitySlug)}`
    : "/places";
  const eventsHref = onboardingCitySlug
    ? `/events?city=${encodeURIComponent(onboardingCitySlug)}`
    : "/events";

  const profilePublicHref =
    username && username.trim().length > 0
      ? `/user/${encodeURIComponent(username.trim())}`
      : "/profile";

  const pickPreview =
    discovery.events[0] ?? discovery.places[0]
      ? {
          kind: discovery.events[0] ? ("event" as const) : ("place" as const),
          event: discovery.events[0],
          place: discovery.places[0],
        }
      : null;

  const hasContributions = contributionPlaces > 0 || contributionEvents > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-10 sm:py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t("eyebrow")}</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("title", { name: displayName })}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section
        className="space-y-3 rounded-2xl border border-border/80 bg-card/50 p-5 shadow-sm"
        aria-labelledby="home-continue-heading"
      >
        <h2 id="home-continue-heading" className="text-sm font-semibold text-foreground">
          {t("continue.title")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("continue.lead")}</p>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link
              href="/notifications"
              className="inline-flex flex-wrap items-baseline gap-x-2 text-brand underline-offset-2 hover:underline"
            >
              <span>{t("continue.notifications")}</span>
              {unreadNotifications > 0 ? (
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium tabular-nums text-brand">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{t("continue.notificationsNone")}</span>
              )}
            </Link>
          </li>
          {followedCities.length > 0 ? (
            <li>
              <Link href="/feed?mode=local" className="text-brand underline-offset-2 hover:underline">
                {t("continue.feedLocal")}
              </Link>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("continue.feedLocalHint")}</span>
            </li>
          ) : null}
          {activationSignals.savedPlaces > 0 ? (
            <li>
              <Link href="/saved/places" className="text-brand underline-offset-2 hover:underline">
                {t("continue.savedPlaces")}
              </Link>
            </li>
          ) : null}
          {activationSignals.savedEvents > 0 ? (
            <li>
              <Link href="/saved/events" className="text-brand underline-offset-2 hover:underline">
                {t("continue.savedEvents")}
              </Link>
            </li>
          ) : null}
          {upcomingParticipationsCount > 0 ? (
            <li>
              <Link href="/participating/events" className="text-brand underline-offset-2 hover:underline">
                {t("continue.participatingEvents")}
              </Link>
            </li>
          ) : null}
          {activationSignals.collectionsCount > 0 ? (
            <li>
              <Link href="/collections" className="text-brand underline-offset-2 hover:underline">
                {t("continue.collections")}
              </Link>
            </li>
          ) : null}
          {hasContributions && username && username.trim().length > 0 ? (
            <li>
              <Link
                href={`${profilePublicHref}#profile-contributed-places`}
                className="text-brand underline-offset-2 hover:underline"
              >
                {t("continue.contributions")}
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/feed" className="text-brand underline-offset-2 hover:underline">
              {t("continue.feed")}
            </Link>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t("continue.feedHint")}</span>
          </li>
          {pickPreview?.kind === "event" && pickPreview.event ? (
            <li>
              <span className="text-muted-foreground">{t("continue.previewEvent")} </span>
              <Link
                href={`/events/${encodeURIComponent(pickPreview.event.slug)}`}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {pickPreview.event.title}
              </Link>
            </li>
          ) : null}
          {pickPreview?.kind === "place" && pickPreview.place ? (
            <li>
              <span className="text-muted-foreground">{t("continue.previewPlace")} </span>
              <Link
                href={`/places/${encodeURIComponent(pickPreview.place.slug)}`}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {pickPreview.place.name}
              </Link>
            </li>
          ) : null}
          <li>
            <Link href={mapHref} className="text-brand underline-offset-2 hover:underline">
              {t("continue.map")}
            </Link>
          </li>
        </ul>
      </section>

      {activationFocus === "cities" ? (
        <section
          className="space-y-3 rounded-2xl border border-brand/20 bg-brand/[0.06] p-5 shadow-sm"
          aria-labelledby="home-activation-heading"
        >
          <h2 id="home-activation-heading" className="text-sm font-semibold text-foreground">
            {t("activation.citiesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("activation.citiesBody")}</p>
          {onboardingCitySlug && onboardingCityLabel ? (
            <p className="text-sm text-foreground">
              {t("activation.citiesOnboardingHint", { city: onboardingCityLabel })}
            </p>
          ) : null}
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href={mapHref} className="font-medium text-brand underline-offset-2 hover:underline">
                {t("activation.linkMapFollow")}
              </Link>
            </li>
            <li>
              <Link href="/feed?mode=local" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkLocalFeed")}
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {activationFocus === "saves" ? (
        <section
          className="space-y-3 rounded-2xl border border-brand/20 bg-brand/[0.06] p-5 shadow-sm"
          aria-labelledby="home-activation-saves-heading"
        >
          <h2 id="home-activation-saves-heading" className="text-sm font-semibold text-foreground">
            {t("activation.savesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("activation.savesBody")}</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href={placesHref} className="font-medium text-brand underline-offset-2 hover:underline">
                {t("activation.linkPlaces")}
              </Link>
            </li>
            <li>
              <Link href={eventsHref} className="font-medium text-brand underline-offset-2 hover:underline">
                {t("activation.linkEvents")}
              </Link>
            </li>
            <li>
              <Link href="/feed" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkFeed")}
              </Link>
            </li>
            <li>
              <Link href="/feed?mode=local" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkLocalFeed")}
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {activationFocus === "more" ? (
        <section
          className="space-y-2 rounded-2xl border border-border/60 bg-muted/25 p-4 shadow-sm"
          aria-labelledby="home-activation-more-heading"
        >
          <h2 id="home-activation-more-heading" className="text-sm font-medium text-foreground">
            {t("activation.moreTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("activation.moreBody")}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li>
              <Link href="/collections" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkCollections")}
              </Link>
            </li>
            <li>
              <Link href="/submit/place" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkSubmitPlace")}
              </Link>
            </li>
            <li>
              <Link href="/submit/event" className="text-brand underline-offset-2 hover:underline">
                {t("activation.linkSubmitEvent")}
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {hasDiscovery ? (
        <section className="space-y-4" aria-labelledby="home-discovery-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="home-discovery-heading" className="text-sm font-semibold text-foreground">
              {t("discovery.title")}
            </h2>
            <Link href="/feed" className="text-xs font-medium text-brand underline-offset-2 hover:underline">
              {t("discovery.moreOnFeed")}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">{t("discovery.footnote")}</p>
          <div className="space-y-4">
            {discovery.places.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("discovery.places")}
                </p>
                <ul className="space-y-2">
                  {discovery.places.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/places/${encodeURIComponent(p.slug)}`}
                        className="block rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground transition-colors hover:border-brand/25"
                      >
                        <span className="font-medium text-brand">{p.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{p.cityLabel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {discovery.events.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("discovery.events")}
                </p>
                <ul className="space-y-2">
                  {discovery.events.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${encodeURIComponent(e.slug)}`}
                        className="block rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground transition-colors hover:border-brand/25"
                      >
                        <span className="font-medium text-brand">{e.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {e.cityLabel} · {formatEventDateRange(locale, e.startsAt, null)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {discovery.collections.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("discovery.collections")}
                </p>
                <ul className="space-y-2">
                  {discovery.collections.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/collections/${c.id}`}
                        className="block rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm transition-colors hover:border-brand/25"
                      >
                        <span className="font-medium text-brand">{c.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border/80 bg-card/50 p-5 shadow-sm" aria-labelledby="home-cities-heading">
        <h2 id="home-cities-heading" className="text-sm font-semibold text-foreground">
          {t("cities.title")}
        </h2>
        {followedCities.length === 0 ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("cities.empty")}</p>
            <Link
              href="/map"
              className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-brand hover:bg-muted/40"
            >
              {t("cities.ctaMap")}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {followedCities.map((city) => (
              <li key={city.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  href={`/cities/${encodeURIComponent(city.slug)}`}
                  className="font-medium text-brand underline-offset-2 hover:underline"
                >
                  {getLocalizedCityDisplayName(locale, city)}
                </Link>
                <Link href="/feed?mode=local" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  {t("cities.feedLocal")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/80 bg-card/50 p-5 shadow-sm" aria-labelledby="home-activity-heading">
        <h2 id="home-activity-heading" className="text-sm font-semibold text-foreground">
          {t("activity.title")}
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href={profilePublicHref} className="text-brand underline-offset-2 hover:underline">
              {t("activity.profile")}
            </Link>
          </li>
          <li>
            <Link href="/profile" className="text-brand underline-offset-2 hover:underline">
              {t("activity.settings")}
            </Link>
          </li>
          <li>
            <Link href="/collections" className="text-brand underline-offset-2 hover:underline">
              {t("activity.collections")}
            </Link>
          </li>
          <li>
            <Link href="/saved/places" className="text-brand underline-offset-2 hover:underline">
              {t("activity.savedPlaces")}
            </Link>
          </li>
          <li>
            <Link href="/saved/events" className="text-brand underline-offset-2 hover:underline">
              {t("activity.savedEvents")}
            </Link>
          </li>
          {upcomingParticipationsCount > 0 ? (
            <li>
              <Link href="/participating/events" className="text-brand underline-offset-2 hover:underline">
                {t("activity.participatingEvents")}
              </Link>
            </li>
          ) : null}
          {(contributionPlaces > 0 || contributionEvents > 0) && username ? (
            <li>
              <Link
                href={`${profilePublicHref}#profile-contributed-places`}
                className="text-brand underline-offset-2 hover:underline"
              >
                {t("activity.contributions")}
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
