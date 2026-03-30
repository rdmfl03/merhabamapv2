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

function reportListPrimaryLabel(report: {
  targetType: ReportTargetType;
  place: { name: string } | null;
  event: { title: string } | null;
  entityComment: { content: string } | null;
  placeCollection: { title: string } | null;
}): string {
  if (report.targetType === "PLACE") {
    return report.place?.name ?? "—";
  }
  if (report.targetType === "EVENT") {
    return report.event?.title ?? "—";
  }
  if (report.targetType === "PLACE_COLLECTION") {
    return report.placeCollection?.title ?? "—";
  }
  const raw = report.entityComment?.content?.trim();
  if (!raw) {
    return "—";
  }
  return raw.length > 72 ? `${raw.slice(0, 72)}…` : raw;
}

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

  const filterClass =
    "rounded-2xl border border-border px-4 py-3 text-sm text-foreground hover:bg-muted/30";

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
        ingest: t("nav.ingest"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <a href={`/${locale}/admin/reports`} className={filterClass}>
              {t("reports.filters.reset")}
            </a>
            <a href={`/${locale}/admin/reports?status=OPEN`} className={filterClass}>
              {t("reports.filters.open")}
            </a>
            <a href={`/${locale}/admin/reports?targetType=PLACE`} className={filterClass}>
              {t("reports.filters.placeOnly")}
            </a>
            <a href={`/${locale}/admin/reports?targetType=EVENT`} className={filterClass}>
              {t("reports.filters.eventOnly")}
            </a>
            <a
              href={`/${locale}/admin/reports?targetType=ENTITY_COMMENT`}
              className={filterClass}
            >
              {t("reports.filters.entityCommentOnly")}
            </a>
            <a
              href={`/${locale}/admin/reports?targetType=PLACE_COLLECTION`}
              className={filterClass}
            >
              {t("reports.filters.collectionOnly")}
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
                      {reportListPrimaryLabel(report)}
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
