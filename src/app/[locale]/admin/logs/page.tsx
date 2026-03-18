import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { listAdminActions } from "@/server/queries/admin/list-admin-actions";

type AdminLogsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function AdminLogsPage({ params }: AdminLogsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, logs] = await Promise.all([
    getTranslations("admin"),
    listAdminActions(),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/logs`}
      title={t("logs.title")}
      description={t("logs.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        aiReview: t("nav.aiReview"),
        ingest: t("nav.ingest"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <Card className="bg-white/90">
        <CardContent className="space-y-3 p-6">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("logs.empty")}</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{log.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.admin.name ?? log.admin.email ?? "Admin"} • {log.actionType}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(log.createdAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
