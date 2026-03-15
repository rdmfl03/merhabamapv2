import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ReportStatusForm } from "@/components/admin/report-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminReportById } from "@/server/queries/admin/get-admin-report-by-id";

type AdminReportDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
};

export default async function AdminReportDetailPage({
  params,
}: AdminReportDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, report] = await Promise.all([
    getTranslations("admin"),
    getAdminReportById(id),
  ]);

  if (!report) {
    notFound();
  }

  const targetTitle =
    report.targetType === "PLACE" ? report.place?.name : report.event?.title;

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/reports`}
      title={t("reportDetail.title")}
      description={t("reportDetail.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {report.targetType}
                </p>
                <h2 className="font-display text-3xl text-foreground">
                  {targetTitle}
                </h2>
              </div>
              <StatusBadge
                tone={
                  report.status === "OPEN"
                    ? "pending"
                    : report.status === "IN_REVIEW"
                      ? "warning"
                      : report.status === "RESOLVED"
                        ? "success"
                        : "danger"
                }
                label={t(`reportStatuses.${report.status.toLowerCase()}`)}
              />
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{t("reportDetail.reason")}</p>
                <p className="text-muted-foreground">{report.reason}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("reportDetail.details")}</p>
                <p className="text-muted-foreground">
                  {report.details ?? t("reportDetail.noDetails")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("reportDetail.author")}</p>
                <p className="text-muted-foreground">
                  {report.user?.name ?? report.user?.email ?? t("reportDetail.unknown")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("reportDetail.target")}</p>
                {report.targetType === "PLACE" && report.place ? (
                  <Link href={`/places/${report.place.slug}`} className="text-brand">
                    {report.place.name}
                  </Link>
                ) : report.targetType === "EVENT" && report.event ? (
                  <Link href={`/events/${report.event.slug}`} className="text-brand">
                    {report.event.title}
                  </Link>
                ) : (
                  <p className="text-muted-foreground">{t("reportDetail.unknown")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <h3 className="font-semibold text-foreground">{t("reportDetail.reviewActions")}</h3>
            <ReportStatusForm
              locale={locale}
              reportId={report.id}
              labels={{
                inReview: t("reportDetail.actions.inReview"),
                resolve: t("reportDetail.actions.resolve"),
                reject: t("reportDetail.actions.reject"),
                success: t("reportDetail.actions.success"),
                error: t("reportDetail.actions.error"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
