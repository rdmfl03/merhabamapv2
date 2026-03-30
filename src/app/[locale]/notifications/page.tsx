import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationInboxItem } from "@/components/notifications/notification-inbox-item";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { markAllNotificationsRead } from "@/server/actions/notifications/notification-read-actions";
import { listNotificationsForUser } from "@/server/queries/notifications/list-notifications-for-user";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: NotificationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/notifications`)}`,
    );
  }

  const [t, rows] = await Promise.all([
    getTranslations("notifications"),
    listNotificationsForUser(session.user.id),
  ]);

  const hasUnread = rows.some((r) => r.readAt === null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {hasUnread ? (
          <form action={markAllNotificationsRead}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              {t("markAllRead")}
            </Button>
          </form>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm text-foreground">{t("empty")}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <NotificationInboxItem key={row.id} row={row} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}
