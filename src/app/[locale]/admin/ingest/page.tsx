import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { SourceRolloutV1Reference } from "@/components/admin/source-rollout-v1-reference";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSourceRolloutV1Sections } from "@/config/ingest-allowlist";
import { Link } from "@/i18n/navigation";
import { listAdminIngestRuns } from "@/server/queries/admin/list-admin-ingest-runs";

type AdminIngestPageProps = {
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
    : status === "RUNNING"
      ? "warning"
      : status === "DONE"
        ? "success"
        : "default";
}

function getSourceRolloutLabels(t: Awaited<ReturnType<typeof getTranslations>>) {
  return {
    title: t("ingest.sourceRollout.title"),
    description: t("ingest.sourceRollout.description"),
    activeBadge: t("ingest.sourceRollout.activeBadge"),
    actionLabel: t("ingest.sourceRollout.actionLabel"),
    sectionLabel: t("ingest.sourceRollout.sectionLabel"),
    empty: t("ingest.sourceRollout.empty"),
    fields: {
      sourceType: t("ingest.sourceRollout.fields.sourceType"),
      domains: t("ingest.sourceRollout.fields.domains"),
      accountHandles: t("ingest.sourceRollout.fields.accountHandles"),
      externalIds: t("ingest.sourceRollout.fields.externalIds"),
      noSourceUrlRequired: t("ingest.sourceRollout.fields.noSourceUrlRequired"),
    },
    sections: {
      shared: t("ingest.sourceRollout.sections.shared"),
      "place.berlin": t("ingest.sourceRollout.sections.placeBerlin"),
      "place.koeln": t("ingest.sourceRollout.sections.placeKoeln"),
      "event.berlin": t("ingest.sourceRollout.sections.eventBerlin"),
      "event.koeln": t("ingest.sourceRollout.sections.eventKoeln"),
    },
  };
}

export default async function AdminIngestPage({
  params,
  searchParams,
}: AdminIngestPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, ingestRuns] = await Promise.all([
    getTranslations("admin"),
    listAdminIngestRuns(),
  ]);
  const sourceRolloutSections = getSourceRolloutV1Sections();
  const sourceRolloutLabels = getSourceRolloutLabels(t);

  const totalCount = ingestRuns.length;
  const runningCount = ingestRuns.filter((run) => run.status === "RUNNING").length;
  const doneCount = ingestRuns.filter((run) => run.status === "DONE").length;
  const failedCount = ingestRuns.filter((run) => run.status === "FAILED").length;
  const statusFilter =
    resolvedSearchParams?.status === "running" ||
    resolvedSearchParams?.status === "done" ||
    resolvedSearchParams?.status === "failed"
      ? resolvedSearchParams.status
      : "all";
  const filteredRuns = ingestRuns.filter((run) => {
    if (statusFilter === "running") {
      return run.status === "RUNNING";
    }

    if (statusFilter === "done") {
      return run.status === "DONE";
    }

    if (statusFilter === "failed") {
      return run.status === "FAILED";
    }

    return true;
  });

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("ingest.title")}
      description={t("ingest.description")}
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
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">{t("ingest.problemItemsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("ingest.problemItemsDescription")}</p>
          </div>
          <Link
            href={`/admin/ingest/raw-items`}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {t("ingest.problemItemsAction")}
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">{t("ingest.sourcesTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("ingest.sourcesDescription")}</p>
          </div>
          <Link
            href={`/admin/ingest/sources`}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {t("ingest.sourcesAction")}
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">{t("ingest.submissionsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("ingest.submissionsDescription")}</p>
          </div>
          <Link
            href={`/admin/ingest/submissions`}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {t("ingest.submissionsAction")}
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardContent className="p-6">
          <SourceRolloutV1Reference
            sections={sourceRolloutSections}
            labels={sourceRolloutLabels}
            reviewHref={`/admin/ingest/raw-items?allowlist=blocked`}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/ingest`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("ingest.filters.all")}
            </Link>
            <Link
              href={`/admin/ingest?status=running`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "running"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("ingest.filters.running")}
            </Link>
            <Link
              href={`/admin/ingest?status=done`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "done"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("ingest.filters.done")}
            </Link>
            <Link
              href={`/admin/ingest?status=failed`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "failed"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("ingest.filters.failed")}
            </Link>
          </div>

          {ingestRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ingest.empty")}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("ingest.summary", {
                  total: totalCount,
                  running: runningCount,
                  done: doneCount,
                  failed: failedCount,
                })}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-3">{t("ingest.columns.id")}</th>
                      <th className="px-3">{t("ingest.columns.pipelineName")}</th>
                      <th className="px-3">{t("ingest.columns.triggerType")}</th>
                      <th className="px-3">{t("ingest.columns.status")}</th>
                      <th className="px-3">{t("ingest.columns.itemsFound")}</th>
                      <th className="px-3">{t("ingest.columns.itemsCreated")}</th>
                      <th className="px-3">{t("ingest.columns.itemsUpdated")}</th>
                      <th className="px-3">{t("ingest.columns.itemsFailed")}</th>
                      <th className="px-3">{t("ingest.columns.startedAt")}</th>
                      <th className="px-3">{t("ingest.columns.finishedAt")}</th>
                      <th className="px-3">{t("ingest.columns.source")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map((run) => (
                      <tr key={run.id}>
                        <td
                          colSpan={11}
                          className="rounded-2xl border border-border bg-white px-0 py-0 shadow-soft"
                        >
                          <div className="grid gap-3 px-3 py-4 md:grid-cols-11 md:items-start">
                            <div className="text-sm text-muted-foreground md:col-span-1 break-all">
                              {run.id}
                            </div>
                            <div className="text-sm font-medium text-foreground md:col-span-1">
                              {run.pipelineName}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {run.triggerType}
                            </div>
                            <div className="md:col-span-1">
                              <StatusBadge
                                tone={getStatusTone(run.status)}
                                label={run.status}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {run.itemsFound}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {run.itemsCreated}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {run.itemsUpdated}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {run.itemsFailed}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(run.startedAt, locale) ??
                                t("ingest.fallbacks.notAvailable")}
                            </div>
                            <div className="text-sm text-muted-foreground md:col-span-1">
                              {formatDate(run.finishedAt, locale) ??
                                t("ingest.fallbacks.notAvailable")}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground md:col-span-1 break-all">
                              <p>{run.source?.name ?? t("ingest.fallbacks.unknownSource")}</p>
                              <p className="text-xs">
                                {run.source?.url ?? t("ingest.fallbacks.notAvailable")}
                              </p>
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
