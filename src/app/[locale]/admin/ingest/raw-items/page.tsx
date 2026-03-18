import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminRawIngestItems } from "@/server/queries/admin/list-admin-raw-ingest-items";

type AdminRawIngestItemsPageProps = {
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
  return status === "FAILED"
    ? "danger"
    : status === "PENDING"
      ? "warning"
      : "default";
}

export default async function AdminRawIngestItemsPage({
  params,
  searchParams,
}: AdminRawIngestItemsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, rawItems] = await Promise.all([
    getTranslations("admin"),
    listAdminRawIngestItems(),
  ]);

  const allCount = rawItems.length;
  const failedCount = rawItems.filter((item) => item.status === "FAILED").length;
  const pendingCount = rawItems.filter((item) => item.status === "PENDING").length;

  const statusFilter =
    resolvedSearchParams?.status === "failed" || resolvedSearchParams?.status === "pending"
      ? resolvedSearchParams.status
      : "all";

  const filteredItems = rawItems.filter((item) => {
    if (statusFilter === "failed") {
      return item.status === "FAILED";
    }

    if (statusFilter === "pending") {
      return item.status === "PENDING";
    }

    return true;
  });

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("rawIngest.title")}
      description={t("rawIngest.description")}
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
              href={`/admin/ingest/raw-items`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.all", { count: allCount })}
            </Link>
            <Link
              href={`/admin/ingest/raw-items?status=failed`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "failed"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.failed", { count: failedCount })}
            </Link>
            <Link
              href={`/admin/ingest/raw-items?status=pending`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "pending"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.pending", { count: pendingCount })}
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("rawIngest.summary", {
              total: allCount,
              failed: failedCount,
              pending: pendingCount,
            })}
          </p>

          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("rawIngest.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-3">{t("rawIngest.columns.id")}</th>
                    <th className="px-3">{t("rawIngest.columns.status")}</th>
                    <th className="px-3">{t("rawIngest.columns.entityGuess")}</th>
                    <th className="px-3">{t("rawIngest.columns.rawTitle")}</th>
                    <th className="px-3">{t("rawIngest.columns.rawDatetimeText")}</th>
                    <th className="px-3">{t("rawIngest.columns.rawLocationText")}</th>
                    <th className="px-3">{t("rawIngest.columns.languageHint")}</th>
                    <th className="px-3">{t("rawIngest.columns.cityGuess")}</th>
                    <th className="px-3">{t("rawIngest.columns.ingestedAt")}</th>
                    <th className="px-3">{t("rawIngest.columns.processedAt")}</th>
                    <th className="px-3">{t("rawIngest.columns.source")}</th>
                    <th className="px-3">{t("rawIngest.columns.errorMessage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td
                        colSpan={12}
                        className="rounded-2xl border border-border bg-white px-0 py-0 shadow-soft"
                      >
                        <div className="grid gap-3 px-3 py-4 md:grid-cols-12 md:items-start">
                          <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                            {item.id}
                          </div>
                          <div className="md:col-span-1">
                            <StatusBadge
                              tone={getStatusTone(item.status)}
                              label={item.status}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {item.entityGuess}
                          </div>
                          <div className="text-sm font-medium text-foreground md:col-span-1">
                            {item.rawTitle ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {item.rawDatetimeText ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {item.rawLocationText ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {item.languageHint ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {item.cityGuess ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {formatDate(item.ingestedAt, locale) ??
                              t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {formatDate(item.processedAt, locale) ??
                              t("rawIngest.fallbacks.notAvailable")}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground md:col-span-1 break-all">
                            <p>{item.source?.name ?? t("rawIngest.fallbacks.unknownSource")}</p>
                            <p className="text-xs">
                              {item.sourceUrl ?? item.source?.url ?? t("rawIngest.fallbacks.notAvailable")}
                            </p>
                            {item.externalId ? (
                              <p className="text-xs">{item.externalId}</p>
                            ) : null}
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1 break-words">
                            {item.errorMessage ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
