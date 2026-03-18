import { getTranslations, setRequestLocale } from "next-intl/server";

import { AllowlistEvaluationSummary } from "@/components/admin/allowlist-evaluation-summary";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminRawIngestItems } from "@/server/queries/admin/list-admin-raw-ingest-items";

type AdminRawIngestItemsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams?: Promise<{ status?: string; allowlist?: string }>;
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
    : status === "BLOCKED_BY_ALLOWLIST"
      ? "warning"
    : status === "PENDING"
      ? "warning"
      : "default";
}

function getAllowlistLabels(t: Awaited<ReturnType<typeof getTranslations>>) {
  return {
    title: t("rawIngest.allowlist.title"),
    pass: t("rawIngest.allowlist.pass"),
    blocked: t("rawIngest.allowlist.blocked"),
    passSummary: t("rawIngest.allowlist.passSummary"),
    blockedSummary: t("rawIngest.allowlist.blockedSummary"),
    rule: t("rawIngest.allowlist.rule"),
    fields: {
      entity: t("rawIngest.allowlist.fields.entity"),
      city: t("rawIngest.allowlist.fields.city"),
      category: t("rawIngest.allowlist.fields.category"),
      sourceType: t("rawIngest.allowlist.fields.sourceType"),
      sourceHost: t("rawIngest.allowlist.fields.sourceHost"),
      matchedSource: t("rawIngest.allowlist.fields.matchedSource"),
    },
    failureGroups: {
      entity: t("rawIngest.allowlist.failureGroups.entity"),
      city: t("rawIngest.allowlist.failureGroups.city"),
      title: t("rawIngest.allowlist.failureGroups.title"),
      source: t("rawIngest.allowlist.failureGroups.source"),
      category: t("rawIngest.allowlist.failureGroups.category"),
    },
    reasonCodes: {
      ENTITY_TYPE_REQUIRED: t("rawIngest.allowlist.reasonCodes.ENTITY_TYPE_REQUIRED"),
      CITY_REQUIRED: t("rawIngest.allowlist.reasonCodes.CITY_REQUIRED"),
      CITY_NOT_ALLOWED: t("rawIngest.allowlist.reasonCodes.CITY_NOT_ALLOWED"),
      TITLE_REQUIRED: t("rawIngest.allowlist.reasonCodes.TITLE_REQUIRED"),
      SOURCE_REQUIRED: t("rawIngest.allowlist.reasonCodes.SOURCE_REQUIRED"),
      SOURCE_TYPE_NOT_ALLOWED: t("rawIngest.allowlist.reasonCodes.SOURCE_TYPE_NOT_ALLOWED"),
      SOURCE_IDENTIFIER_REQUIRED: t("rawIngest.allowlist.reasonCodes.SOURCE_IDENTIFIER_REQUIRED"),
      SOURCE_NOT_ALLOWED: t("rawIngest.allowlist.reasonCodes.SOURCE_NOT_ALLOWED"),
      CATEGORY_REQUIRED: t("rawIngest.allowlist.reasonCodes.CATEGORY_REQUIRED"),
      PLACE_CATEGORY_NOT_ALLOWED: t("rawIngest.allowlist.reasonCodes.PLACE_CATEGORY_NOT_ALLOWED"),
      EVENT_CATEGORY_NOT_ALLOWED: t("rawIngest.allowlist.reasonCodes.EVENT_CATEGORY_NOT_ALLOWED"),
    },
  };
}

function buildRawItemsHref(status: "all" | "failed" | "pending", allowlist: "all" | "blocked") {
  const searchParams = new URLSearchParams();

  if (status !== "all") {
    searchParams.set("status", status);
  }

  if (allowlist === "blocked") {
    searchParams.set("allowlist", allowlist);
  }

  const query = searchParams.toString();
  return query ? `/admin/ingest/raw-items?${query}` : "/admin/ingest/raw-items";
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
  const allowlistBlockedCount = rawItems.filter((item) => item.allowlistBlocked).length;
  const allowlistPassedCount = rawItems.length - allowlistBlockedCount;
  const allowlistLabels = getAllowlistLabels(t);

  const statusFilter =
    resolvedSearchParams?.status === "failed" || resolvedSearchParams?.status === "pending"
      ? resolvedSearchParams.status
      : "all";
  const allowlistFilter = resolvedSearchParams?.allowlist === "blocked" ? "blocked" : "all";

  const filteredItems = rawItems.filter((item) => {
    if (statusFilter === "failed") {
      if (item.status !== "FAILED") {
        return false;
      }
    }

    if (statusFilter === "pending") {
      if (item.status !== "PENDING") {
        return false;
      }
    }

    if (allowlistFilter === "blocked" && !item.allowlistBlocked) {
      return false;
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
              href={buildRawItemsHref("all", allowlistFilter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.all", { count: allCount })}
            </Link>
            <Link
              href={buildRawItemsHref("failed", allowlistFilter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "failed"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.failed", { count: failedCount })}
            </Link>
            <Link
              href={buildRawItemsHref("pending", allowlistFilter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "pending"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.pending", { count: pendingCount })}
            </Link>
            <Link
              href={buildRawItemsHref(statusFilter, "blocked")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                allowlistFilter === "blocked"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("rawIngest.filters.allowlistBlocked", { count: allowlistBlockedCount })}
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("rawIngest.summary", {
              total: allCount,
              failed: failedCount,
              pending: pendingCount,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("rawIngest.allowlistSummary", {
              blocked: allowlistBlockedCount,
              passed: allowlistPassedCount,
            })}
          </p>
          {allowlistFilter === "blocked" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <p>{t("rawIngest.activeAllowlistBlockedHint")}</p>
              <Link
                href={buildRawItemsHref(statusFilter, "all")}
                className="rounded-full border border-amber-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-white"
              >
                {t("rawIngest.clearAllowlistBlockedFilter")}
              </Link>
            </div>
          ) : null}

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
                              tone={getStatusTone(item.effectiveStatus)}
                              label={item.effectiveStatus}
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
                            {item.effectiveErrorMessage ?? t("rawIngest.fallbacks.notAvailable")}
                          </div>
                        </div>
                        <div className="border-t border-border/70 px-3 py-3">
                          <AllowlistEvaluationSummary
                            evaluation={item.allowlistEvaluation}
                            labels={allowlistLabels}
                          />
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
