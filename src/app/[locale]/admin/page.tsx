import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminOverview } from "@/server/queries/admin/get-admin-overview";

type AdminOverviewPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function AdminOverviewPage({
  params,
}: AdminOverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, overview] = await Promise.all([
    getTranslations("admin"),
    getAdminOverview(),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin`}
      title={t("overview.title")}
      description={t("overview.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.openReports")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.openReports}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.pendingClaims")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.pendingClaims}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold text-foreground">{t("overview.recentActions")}</h2>
          <div className="space-y-3">
            {overview.recentActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("overview.noActions")}</p>
            ) : (
              overview.recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.actionType} • {action.targetType}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(action.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
