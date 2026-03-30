import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { NOTIFICATION_TYPE } from "@/lib/notifications/notification-types";
import { formatRelativeFeedTime } from "@/lib/social/format-relative-feed-time";
import type { NotificationListRow } from "@/server/queries/notifications/list-notifications-for-user";
import { markNotificationRead } from "@/server/actions/notifications/notification-read-actions";

type NotificationInboxItemProps = {
  row: NotificationListRow;
  locale: AppLocale;
};

export async function NotificationInboxItem({ row, locale }: NotificationInboxItemProps) {
  const t = await getTranslations("notifications");

  const actorLabel =
    row.actor?.name?.trim() ||
    (row.actor?.username ? `@${row.actor.username}` : null) ||
    t("unknownActor");

  const actorProfileHref =
    row.actor?.username != null && row.actor.username.trim().length > 0
      ? `/user/${encodeURIComponent(row.actor.username)}`
      : null;

  const targetHref =
    row.type === NOTIFICATION_TYPE.NEW_FOLLOWER && actorProfileHref
      ? actorProfileHref
      : row.type === NOTIFICATION_TYPE.COMMENT_ON_MY_CONTENT && row.placeSlug
        ? `/places/${row.placeSlug}`
        : row.type === NOTIFICATION_TYPE.COMMENT_ON_MY_CONTENT && row.eventSlug
          ? `/events/${row.eventSlug}`
          : null;

  const isUnread = row.readAt === null;

  const suffixKey =
    row.type === NOTIFICATION_TYPE.NEW_FOLLOWER
      ? "followSuffix"
      : row.entityType === "event"
        ? "commentEventSuffix"
        : "commentPlaceSuffix";

  const openTargetLabel =
    row.type === NOTIFICATION_TYPE.NEW_FOLLOWER
      ? t("openProfile")
      : row.entityType === "event"
        ? t("openEvent")
        : t("openPlace");

  return (
    <li
      className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
        isUnread ? "border-brand/30 bg-brand/[0.04]" : "border-border/70 bg-card/80"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="leading-relaxed text-foreground">
            {actorProfileHref ? (
              <Link
                href={actorProfileHref}
                className="font-semibold text-brand underline-offset-2 hover:underline"
              >
                {actorLabel}
              </Link>
            ) : (
              <span className="font-semibold">{actorLabel}</span>
            )}{" "}
            {t(`copy.${suffixKey}`)}
          </p>
          {targetHref ? (
            <p>
              <Link
                href={targetHref}
                className="text-xs font-medium text-brand underline-offset-2 hover:underline"
              >
                {openTargetLabel}
              </Link>
            </p>
          ) : null}
          <time className="block text-xs text-muted-foreground" dateTime={row.createdAt.toISOString()}>
            {formatRelativeFeedTime(row.createdAt.toISOString(), locale)}
          </time>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {!isUnread ? (
            <span className="text-xs text-muted-foreground">{t("readLabel")}</span>
          ) : (
            <form action={markNotificationRead}>
              <input type="hidden" name="notificationId" value={row.id} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                {t("markRead")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
