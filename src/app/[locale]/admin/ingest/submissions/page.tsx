import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminSubmissions } from "@/server/queries/admin/list-admin-submissions";

type AdminSubmissionsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams?: Promise<{ status?: string }>;
};

function formatDate(value: Date | null, locale: "de" | "tr") {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusTone(status: string) {
  return status === "PENDING"
    ? "warning"
    : status === "APPROVED" || status === "DONE"
      ? "success"
      : status === "REJECTED" || status === "FAILED"
        ? "danger"
        : "default";
}

export default async function AdminSubmissionsPage({
  params,
  searchParams,
}: AdminSubmissionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, submissions] = await Promise.all([
    getTranslations("admin"),
    listAdminSubmissions(),
  ]);
  const totalCount = submissions.length;
  const pendingCount = submissions.filter((submission) => submission.status === "PENDING").length;
  const approvedCount = submissions.filter(
    (submission) => submission.status === "APPROVED" || submission.status === "DONE",
  ).length;
  const rejectedCount = submissions.filter(
    (submission) => submission.status === "REJECTED" || submission.status === "FAILED",
  ).length;
  const statusFilter =
    resolvedSearchParams?.status === "pending" ||
    resolvedSearchParams?.status === "approved" ||
    resolvedSearchParams?.status === "rejected"
      ? resolvedSearchParams.status
      : "all";
  const filteredSubmissions = submissions.filter((submission) => {
    if (statusFilter === "pending") {
      return submission.status === "PENDING";
    }

    if (statusFilter === "approved") {
      return submission.status === "APPROVED" || submission.status === "DONE";
    }

    if (statusFilter === "rejected") {
      return submission.status === "REJECTED" || submission.status === "FAILED";
    }

    return true;
  });

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("submissions.title")}
      description={t("submissions.description")}
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
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/ingest/submissions`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.all", { count: totalCount })}
            </Link>
            <Link
              href={`/admin/ingest/submissions?status=pending`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "pending"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.pending", { count: pendingCount })}
            </Link>
            <Link
              href={`/admin/ingest/submissions?status=approved`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "approved"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.approved", { count: approvedCount })}
            </Link>
            <Link
              href={`/admin/ingest/submissions?status=rejected`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "rejected"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.rejected", { count: rejectedCount })}
            </Link>
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("submissions.empty")}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("submissions.summary", {
                  total: totalCount,
                  pending: pendingCount,
                  approved: approvedCount,
                  rejected: rejectedCount,
                })}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-3">{t("submissions.columns.id")}</th>
                      <th className="px-3">{t("submissions.columns.submissionType")}</th>
                      <th className="px-3">{t("submissions.columns.status")}</th>
                      <th className="px-3">{t("submissions.columns.targetEntityType")}</th>
                      <th className="px-3">{t("submissions.columns.targetEntityId")}</th>
                      <th className="px-3">{t("submissions.columns.submittedByUserId")}</th>
                      <th className="px-3">{t("submissions.columns.sourceUrl")}</th>
                      <th className="px-3">{t("submissions.columns.reviewedByUserId")}</th>
                      <th className="px-3">{t("submissions.columns.reviewedAt")}</th>
                      <th className="px-3">{t("submissions.columns.createdAt")}</th>
                      <th className="px-3">{t("submissions.columns.updatedAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td
                          colSpan={11}
                          className="rounded-2xl border border-border bg-white px-0 py-0 shadow-soft"
                        >
                          <div className="grid gap-3 px-3 py-4 md:grid-cols-11 md:items-start">
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {submission.id}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {submission.submissionType}
                            </div>
                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={getStatusTone(submission.status)}
                                label={submission.status}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {submission.targetEntityType ?? t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {submission.targetEntityId ?? t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {submission.submittedByUserId ?? t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {submission.sourceUrl ?? t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {submission.reviewedByUserId ?? t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(submission.reviewedAt, locale) ??
                                t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(submission.createdAt, locale) ??
                                t("submissions.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(submission.updatedAt, locale) ??
                                t("submissions.fallbacks.notAvailable")}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
