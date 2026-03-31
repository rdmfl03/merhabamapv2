import { Bell } from "lucide-react";
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
  const ariaLabel = count > 0 ? t("notificationsAriaUnread", { count }) : t("notifications");

  return (
    <Button variant="outline" size="sm" className="relative h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-10" asChild>
      <Link href="/notifications" aria-label={ariaLabel} title={t("notifications")}>
        <Bell className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        {count > 0 ? (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white",
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
