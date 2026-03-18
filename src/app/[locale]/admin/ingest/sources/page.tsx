import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminSources } from "@/server/queries/admin/list-admin-sources";

type AdminSourcesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams?: Promise<{ filter?: string; kind?: string }>;
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

export default async function AdminSourcesPage({
  params,
  searchParams,
}: AdminSourcesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, sources] = await Promise.all([
    getTranslations("admin"),
    listAdminSources(),
  ]);
  const availableSourceKinds = Array.from(
    new Set(
      sources
        .map((source) => source.sourceKind?.trim())
        .filter((kind): kind is string => Boolean(kind)),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const sourceFilter =
    resolvedSearchParams?.filter === "active" || resolvedSearchParams?.filter === "public"
      ? resolvedSearchParams.filter
      : "all";
  const sourceKindFilter =
    resolvedSearchParams?.kind && availableSourceKinds.includes(resolvedSearchParams.kind)
      ? resolvedSearchParams.kind
      : "all";
  const totalCount = sources.length;
  const activeCount = sources.filter((source) => source.isActive).length;
  const publicCount = sources.filter((source) => source.isPublic).length;
  const filteredSources = sources.filter((source) => {
    if (sourceKindFilter !== "all" && source.sourceKind !== sourceKindFilter) {
      return false;
    }

    if (sourceFilter === "active") {
      return source.isActive;
    }

    if (sourceFilter === "public") {
      return source.isPublic;
    }

    return true;
  });

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("sources.title")}
      description={t("sources.description")}
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
              href={`/admin/ingest/sources`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                sourceFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("sources.filters.all", { count: totalCount })}
            </Link>
            <Link
              href={`/admin/ingest/sources?filter=active`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                sourceFilter === "active"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("sources.filters.active", { count: activeCount })}
            </Link>
            <Link
              href={`/admin/ingest/sources?filter=public`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                sourceFilter === "public"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("sources.filters.public", { count: publicCount })}
            </Link>
          </div>

          {availableSourceKinds.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={
                  sourceFilter === "all"
                    ? `/admin/ingest/sources`
                    : `/admin/ingest/sources?filter=${sourceFilter}`
                }
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  sourceKindFilter === "all"
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-foreground hover:bg-muted"
                }`}
              >
                {t("sources.kindFilters.all")}
              </Link>
              {availableSourceKinds.map((kind) => (
                <Link
                  key={kind}
                  href={
                    sourceFilter === "all"
                      ? `/admin/ingest/sources?kind=${encodeURIComponent(kind)}`
                      : `/admin/ingest/sources?filter=${sourceFilter}&kind=${encodeURIComponent(
                          kind,
                        )}`
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    sourceKindFilter === kind
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white text-foreground hover:bg-muted"
                  }`}
                >
                  {kind}
                </Link>
              ))}
            </div>
          ) : null}

          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sources.empty")}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("sources.summary", {
                  total: totalCount,
                  active: activeCount,
                  public: publicCount,
                })}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-3">{t("sources.columns.id")}</th>
                      <th className="px-3">{t("sources.columns.sourceKind")}</th>
                      <th className="px-3">{t("sources.columns.name")}</th>
                      <th className="px-3">{t("sources.columns.url")}</th>
                      <th className="px-3">{t("sources.columns.accountHandle")}</th>
                      <th className="px-3">{t("sources.columns.externalId")}</th>
                      <th className="px-3">{t("sources.columns.isPublic")}</th>
                      <th className="px-3">{t("sources.columns.isActive")}</th>
                      <th className="px-3">{t("sources.columns.trustScore")}</th>
                      <th className="px-3">{t("sources.columns.discoveryMethod")}</th>
                      <th className="px-3">{t("sources.columns.lastCheckedAt")}</th>
                      <th className="px-3">{t("sources.columns.updatedAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSources.map((source) => (
                      <tr key={source.id}>
                        <td
                          colSpan={12}
                          className="rounded-2xl border border-border bg-white px-0 py-0 shadow-soft"
                        >
                          <div className="grid gap-3 px-3 py-4 md:grid-cols-12 md:items-start">
                          <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                            <Link
                              href={`/admin/ingest/sources/${source.id}`}
                              className="text-brand hover:underline"
                            >
                              {source.id}
                            </Link>
                          </div>
                          <div className="text-sm text-muted-foreground md:col-span-1">
                            {source.sourceKind}
                          </div>
                          <div className="text-sm font-medium text-foreground md:col-span-1">
                            {source.name ? (
                              <Link
                                href={`/admin/ingest/sources/${source.id}`}
                                className="text-foreground hover:text-brand"
                              >
                                {source.name}
                              </Link>
                            ) : (
                              t("sources.fallbacks.notAvailable")
                            )}
                          </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {source.url}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {source.accountHandle ?? t("sources.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {source.externalId ?? t("sources.fallbacks.notAvailable")}
                            </div>
                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={source.isPublic ? "success" : "default"}
                                label={
                                  source.isPublic
                                    ? t("sources.badges.public")
                                    : t("sources.badges.private")
                                }
                              />
                            </div>
                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={source.isActive ? "success" : "warning"}
                                label={
                                  source.isActive
                                    ? t("sources.badges.active")
                                    : t("sources.badges.inactive")
                                }
                              />
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {source.trustScore}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {source.discoveryMethod ?? t("sources.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(source.lastCheckedAt, locale) ??
                                t("sources.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(source.updatedAt, locale) ??
                                t("sources.fallbacks.notAvailable")}
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
