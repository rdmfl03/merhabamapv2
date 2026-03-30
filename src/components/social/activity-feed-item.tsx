import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";
import { formatRelativeFeedTime } from "@/lib/social/format-relative-feed-time";
import { cn } from "@/lib/utils";

export type ActivityFeedItemModel = {
  id: string;
  type: string;
  username: string | null;
  actorDisplayName?: string | null;
  entity: {
    type: string;
    name: string | null;
    slug: string | null;
  };
  /** COLLECTION_PLACE_ADDED */
  collectionTitle?: string | null;
  /** Place-/Event-Ort, z. B. für „in Berlin“ */
  cityLabel?: string | null;
  created_at: string;
};

type ActivityFeedItemProps = {
  item: ActivityFeedItemModel;
  locale: AppLocale;
  showActor?: boolean;
};

function EntityNameLink({
  entityType,
  slug,
  name,
  fallback,
}: {
  entityType: string;
  slug: string | null;
  name: string | null;
  fallback: string;
}) {
  const label = name?.trim() || fallback;
  if (entityType === "place" && slug) {
    return (
      <Link href={`/places/${slug}`} className="font-medium underline-offset-2 hover:underline">
        {label}
      </Link>
    );
  }
  if (entityType === "event" && slug) {
    return (
      <Link href={`/events/${slug}`} className="font-medium underline-offset-2 hover:underline">
        {label}
      </Link>
    );
  }
  if (entityType === ACTIVITY_ENTITY.collection && slug) {
    return (
      <Link href={`/collections/${slug}`} className="font-medium underline-offset-2 hover:underline">
        {label}
      </Link>
    );
  }
  if (entityType === ACTIVITY_ENTITY.city && slug) {
    return (
      <Link href={`/map?city=${slug}`} className="font-medium underline-offset-2 hover:underline">
        {label}
      </Link>
    );
  }
  return <span className="font-medium">{label}</span>;
}

export async function ActivityFeedItem({ item, locale, showActor = true }: ActivityFeedItemProps) {
  const t = await getTranslations("feed.activity");
  const fallback = t("unknownEntity");

  const nameNode = (
    <EntityNameLink
      entityType={item.entity.type}
      slug={item.entity.slug}
      name={item.entity.name}
      fallback={fallback}
    />
  );

  const citySuffix = item.cityLabel?.trim() ? (
    <span className="text-muted-foreground"> {t("inCity", { city: item.cityLabel.trim() })}</span>
  ) : null;

  const actorLabel =
    item.actorDisplayName?.trim() || item.username?.trim() || null;

  let body: React.ReactNode;
  if (item.type === ACTIVITY_TYPE.SAVE_PLACE) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("savedPlaceVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("savedPlaceOwn")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.NEW_PLACE) {
    body = (
      <>
        {t("newPlaceLead")} {nameNode}
        {citySuffix}
      </>
    );
  } else if (item.type === ACTIVITY_TYPE.NEW_EVENT) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("addedEventVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("newEventLead")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.COMMENT_PLACE) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("commentPlaceVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("commentPlaceOwn")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.COMMENT_EVENT) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("commentEventVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("commentEventOwn")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.EVENT_INTERESTED) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("eventInterestedVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("eventInterestedOwn")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.EVENT_GOING) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("eventGoingVerb")} {nameNode}
          {citySuffix}
        </>
      );
    } else {
      body = (
        <>
          {t("eventGoingOwn")} {nameNode}
          {citySuffix}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.COLLECTION_CREATED) {
    const createdTail = t("collectionCreatedCreatedDe").trim();
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("collectionCreatedHasList")} {nameNode}
          {createdTail ? <> {createdTail}</> : null}
        </>
      );
    } else {
      body = (
        <>
          {t("collectionCreatedOwn")} {nameNode}
        </>
      );
    }
  } else if (item.type === ACTIVITY_TYPE.COLLECTION_PLACE_ADDED) {
    const coll = item.collectionTitle?.trim() || fallback;
    if (showActor && item.username && actorLabel) {
      body =
        locale === "tr" ? (
          <>
            <Link
              href={`/user/${encodeURIComponent(item.username)}`}
              className="font-semibold text-brand hover:underline"
            >
              {actorLabel}
            </Link>{" "}
            {t("collectionPlaceAddedTr", { collection: coll })} {nameNode}
            {citySuffix}
          </>
        ) : (
          <>
            <Link
              href={`/user/${encodeURIComponent(item.username)}`}
              className="font-semibold text-brand hover:underline"
            >
              {actorLabel}
            </Link>{" "}
            {t("collectionPlaceAddedDeHat")} {nameNode}{" "}
            {t("collectionPlaceAddedDeZuListe", { collection: coll })}
            {citySuffix}
          </>
        );
    } else {
      body =
        locale === "tr" ? (
          <>
            {nameNode} {t("collectionPlaceAddedOwnTr", { collection: coll })}
            {citySuffix}
          </>
        ) : (
          <>
            {t("collectionPlaceAddedOwnDe", { collection: coll })} {nameNode}
            {citySuffix}
          </>
        );
    }
  } else if (item.type === ACTIVITY_TYPE.CITY_FOLLOWED) {
    if (showActor && item.username && actorLabel) {
      body = (
        <>
          <Link
            href={`/user/${encodeURIComponent(item.username)}`}
            className="font-semibold text-brand hover:underline"
          >
            {actorLabel}
          </Link>{" "}
          {t("cityFollowedVerb")} {nameNode}
        </>
      );
    } else {
      body = (
        <>
          {t("cityFollowedOwn")} {nameNode}
        </>
      );
    }
  } else {
    body = <span>{t("genericType", { type: item.type })}</span>;
  }

  const relative = formatRelativeFeedTime(item.created_at, locale);

  return (
    <li
      className={cn(
        "rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-foreground shadow-sm",
      )}
    >
      <p className="leading-relaxed">{body}</p>
      <time className="mt-1 block text-xs text-muted-foreground" dateTime={item.created_at}>
        {relative}
      </time>
    </li>
  );
}
