import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { FeedMode } from "@/server/queries/social/get-feed-activities";

type FeedReturnHintsProps = {
  mode: FeedMode;
  hasFollowedCities: boolean;
  unreadNotifications: number;
};

/**
 * Small, honest context above the feed list — no pressure, no hidden logic.
 */
export async function FeedReturnHints({
  mode,
  hasFollowedCities,
  unreadNotifications,
}: FeedReturnHintsProps) {
  const t = await getTranslations("feed");

  const showLocalShortcut = hasFollowedCities && mode === "default";
  const showNotificationsShortcut = unreadNotifications > 0;

  if (!showLocalShortcut && !showNotificationsShortcut) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
      <p>{mode === "local" ? t("returnHints.contextLocal") : t("returnHints.contextDefault")}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {showLocalShortcut ? (
          <li>
            <Link href="/feed?mode=local" className="font-medium text-brand underline-offset-2 hover:underline">
              {t("returnHints.openLocalFeed")}
            </Link>
          </li>
        ) : null}
        {showNotificationsShortcut ? (
          <li>
            <Link href="/notifications" className="font-medium text-brand underline-offset-2 hover:underline">
              {t("returnHints.openNotifications", {
                count: unreadNotifications > 99 ? "99+" : unreadNotifications,
              })}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
