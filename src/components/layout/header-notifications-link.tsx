import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getUnreadNotificationCount } from "@/server/queries/notifications/get-unread-notification-count";

type HeaderNotificationsLinkProps = {
  userId: string;
};

export async function HeaderNotificationsLink({ userId }: HeaderNotificationsLinkProps) {
  const t = await getTranslations("common");
  const count = await getUnreadNotificationCount(userId);

  return (
    <Button variant="outline" size="sm" className="relative md:h-10 md:px-4 md:text-sm" asChild>
      <Link
        href="/notifications"
        aria-label={count > 0 ? t("notificationsAriaUnread", { count }) : t("notifications")}
      >
        <span>{t("notifications")}</span>
        {count > 0 ? (
          <span
            className={cn(
              "ml-1.5 inline-flex min-w-[1.125rem] justify-center rounded-full bg-brand px-1 py-0 text-[10px] font-semibold leading-none text-white",
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
