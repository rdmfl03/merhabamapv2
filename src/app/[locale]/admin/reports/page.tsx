import { ReportStatus, ReportTargetType } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminReports } from "@/server/queries/admin/list-admin-reports";

type AdminReportsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({
  params,
  searchParams,
}: AdminReportsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const status =
    typeof rawSearchParams.status === "string" &&
    rawSearchParams.status in ReportStatus
      ? (rawSearchParams.status as ReportStatus)
      : undefined;
  const targetType =
    typeof rawSearchParams.targetType === "string" &&
    rawSearchParams.targetType in ReportTargetType
      ? (rawSearchParams.targetType as ReportTargetType)
      : undefined;

  const [t, reports] = await Promise.all([
    getTranslations("admin"),
    listAdminReports({ status, targetType }),
  ]);

  const statusTone = (value: ReportStatus) =>
    value === "OPEN"
      ? "pending"
      : value === "IN_REVIEW"
        ? "warning"
        : value === "RESOLVED"
          ? "success"
          : "danger";

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/reports`}
      title={t("reports.title")}
      description={t("reports.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        aiReview: t("nav.aiReview"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href={`/${locale}/admin/reports`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("reports.filters.reset")}
            </a>
            <a
              href={`/${locale}/admin/reports?status=OPEN`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("reports.filters.open")}
            </a>
            <a
              href={`/${locale}/admin/reports?targetType=PLACE`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("reports.filters.placeOnly")}
            </a>
          </div>

          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("reports.empty")}</p>
            ) : (
              reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/admin/reports/${report.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {report.targetType === "PLACE"
                        ? report.place?.name
                        : report.event?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.targetType} • {report.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      tone={statusTone(report.status)}
                      label={t(`reportStatuses.${report.status.toLowerCase()}`)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(report.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
