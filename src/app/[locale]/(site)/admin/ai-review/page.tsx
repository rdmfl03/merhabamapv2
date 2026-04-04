import { getTranslations, setRequestLocale } from "next-intl/server";

import { AiReviewActionForm } from "@/components/admin/ai-review-action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  getAdminAiReviewQueue,
  getAdminAiReviewSummary,
} from "@/server/queries/admin/get-admin-ai-review-queue";

type AdminAiReviewPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams?: Promise<{ review?: string }>;
};

const allowedStatuses = new Set(["ok", "review", "unsure", "reject"]);

function normalizeStatusKey(value: string | null | undefined) {
  const status = value?.toLowerCase();
  if (!status) {
    return "not_checked";
  }

  return allowedStatuses.has(status) ? status : "unknown";
}

function formatDate(
  value: Date | string | null | undefined,
  locale: "de" | "tr",
) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatReasonCodes(value: string[] | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value;
}

export default async function AdminAiReviewPage({
  params,
  searchParams,
}: AdminAiReviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, rows, summary] = await Promise.all([
    getTranslations("admin"),
    getAdminAiReviewQueue(),
    getAdminAiReviewSummary(),
  ]);

  const reviewFilter =
    resolvedSearchParams?.review === "manual" || resolvedSearchParams?.review === "clear"
      ? resolvedSearchParams.review
      : "all";

  const filteredRows = rows.filter((row) => {
    if (reviewFilter === "manual") {
      return row.needsManualReview;
    }

    if (reviewFilter === "clear") {
      return !row.needsManualReview;
    }

    return true;
  });

  const summaryMap = new Map(
    summary.map((entry) => [normalizeStatusKey(entry.aiReviewStatus), entry.count]),
  );

  const statusTone = (value: string) =>
    value === "reject"
      ? "danger"
      : value === "review" || value === "unsure"
        ? "warning"
        : value === "ok"
          ? "success"
          : "default";

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ai-review`}
      title={t("aiReview.title")}
      description={t("aiReview.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        aiReview: t("nav.aiReview"),
        ingest: t("nav.ingest"),
        places: t("nav.places"),
        logs: t("nav.logs"),
        productInsights: t("nav.productInsights"),
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(["reject", "review", "unsure", "ok", "unknown"] as const).map((status) => (
          <Card key={status} className="bg-white/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-muted-foreground">
                {t(`aiReview.summary.${status}`)}
              </p>
              <p className="font-display text-4xl text-foreground">
                {summaryMap.get(status) ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/ai-review`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                reviewFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("aiReview.filters.all")}
            </Link>
            <Link
              href={`/admin/ai-review?review=manual`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                reviewFilter === "manual"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("aiReview.filters.manual")}
            </Link>
            <Link
              href={`/admin/ai-review?review=clear`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                reviewFilter === "clear"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("aiReview.filters.clear")}
            </Link>
          </div>

          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("aiReview.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-3">{t("aiReview.columns.entity")}</th>
                    <th className="px-3">{t("aiReview.columns.label")}</th>
                    <th className="px-3">{t("aiReview.columns.reviewSignal")}</th>
                    <th className="px-3">{t("aiReview.columns.city")}</th>
                    <th className="px-3">{t("aiReview.columns.startsAt")}</th>
                    <th className="px-3">{t("aiReview.columns.status")}</th>
                    <th className="px-3">{t("aiReview.columns.confidence")}</th>
                    <th className="px-3">{t("aiReview.columns.suggestedAction")}</th>
                    <th className="px-3">{t("aiReview.columns.reasonCodes")}</th>
                    <th className="px-3">{t("aiReview.columns.explanation")}</th>
                    <th className="px-3">{t("aiReview.columns.checkedAt")}</th>
                    <th className="px-3">{t("aiReview.columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => {
                    const statusKey = normalizeStatusKey(row.aiReviewStatus);
                    const normalizedEntityType = row.entityType?.toLowerCase();
                    const detailHref =
                      row.entityId && normalizedEntityType === "place"
                        ? `/admin/places/${row.entityId}`
                        : row.entityId && normalizedEntityType === "event"
                          ? `/admin/events/${row.entityId}`
                          : null;

                    return (
                      <tr key={`${row.entityType ?? "unknown"}-${row.entityId ?? index}`}>
                        <td
                          colSpan={12}
                          className="rounded-2xl border border-border bg-white px-0 py-0 shadow-soft"
                        >
                          <div className="grid gap-3 px-3 py-4 md:grid-cols-12 md:items-start">
                            <div className="space-y-1 md:col-span-1">
                              <p className="text-sm font-medium text-foreground">
                                {row.entityType ?? t("aiReview.fallbacks.unknown")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {row.entityId ?? t("aiReview.fallbacks.notAvailable")}
                              </p>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <p className="text-sm font-medium text-foreground">
                                {row.label ?? t("aiReview.fallbacks.untitled")}
                              </p>
                              {detailHref ? (
                                <Link href={detailHref} className="text-xs text-brand">
                                  {normalizedEntityType === "event"
                                    ? t("aiReview.openEvent")
                                    : t("aiReview.openPlace")}
                                </Link>
                              ) : null}
                            </div>

                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={row.needsManualReview ? "warning" : "success"}
                                label={
                                  row.needsManualReview
                                    ? t("aiReview.manualReview.required")
                                    : t("aiReview.manualReview.notRequired")
                                }
                              />
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {row.cityName ?? t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(row.startsAt, locale) ??
                                t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={statusTone(statusKey)}
                                label={t(`aiReviewStatuses.${statusKey}`)}
                              />
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {row.aiConfidenceScore != null
                                ? row.aiConfidenceScore.toFixed(2)
                                : t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {row.suggestedAction ?? t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatReasonCodes(row.reasonCodes) ??
                                t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {row.explanation ?? t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(row.checkedAt, locale) ??
                                t("aiReview.fallbacks.notAvailable")}
                            </div>

                            <div className="md:col-span-1">
                              {row.entityType && row.entityId ? (
                                <AiReviewActionForm
                                  locale={locale}
                                  entityType={
                                    row.entityType.toLowerCase() === "event" ? "event" : "place"
                                  }
                                  entityId={row.entityId}
                                  labels={{
                                    approve: t("aiModeration.approve"),
                                    review: t("aiModeration.review"),
                                    reject: t("aiModeration.reject"),
                                    rerun: t("aiModeration.rerun"),
                                    error: t("aiModeration.error"),
                                  }}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {t("aiReview.fallbacks.notAvailable")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
