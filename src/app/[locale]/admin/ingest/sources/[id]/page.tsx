import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSourceById } from "@/server/queries/admin/get-admin-source-by-id";

type AdminSourceDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
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

function getRunStatusTone(status: string) {
  return status === "FAILED"
    ? "danger"
    : status === "RUNNING"
      ? "warning"
      : status === "DONE"
        ? "success"
        : "default";
}

function getRawItemStatusTone(status: string) {
  return status === "FAILED" ? "danger" : status === "PENDING" ? "warning" : "default";
}

export default async function AdminSourceDetailPage({
  params,
}: AdminSourceDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, source] = await Promise.all([
    getTranslations("admin"),
    getAdminSourceById(id),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("sourceDetail.title")}
      description={t("sourceDetail.description")}
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
      <div className="space-y-6">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-foreground">
                  {source.name ?? t("sourceDetail.noName")}
                </h2>
                <p className="text-sm text-muted-foreground">{source.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={source.isPublic ? "success" : "default"}
                  label={
                    source.isPublic
                      ? t("sourceDetail.badges.public")
                      : t("sourceDetail.badges.private")
                  }
                />
                <StatusBadge
                  tone={source.isActive ? "success" : "warning"}
                  label={
                    source.isActive
                      ? t("sourceDetail.badges.active")
                      : t("sourceDetail.badges.inactive")
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.sourceKind")}</p>
                <p className="text-sm text-muted-foreground">
                  {source.sourceKind ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.url")}</p>
                <p className="text-sm text-muted-foreground break-all">
                  {source.url ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.accountHandle")}</p>
                <p className="text-sm text-muted-foreground">
                  {source.accountHandle ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.externalId")}</p>
                <p className="text-sm text-muted-foreground break-all">
                  {source.externalId ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.trustScore")}</p>
                <p className="text-sm text-muted-foreground">
                  {source.trustScore ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.discoveryMethod")}</p>
                <p className="text-sm text-muted-foreground">
                  {source.discoveryMethod ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.lastCheckedAt")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(source.lastCheckedAt, locale) ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.createdAt")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(source.createdAt, locale) ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("sourceDetail.updatedAt")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(source.updatedAt, locale) ?? t("sourceDetail.notAvailable")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-semibold text-foreground">{t("sourceDetail.ingestRunsTitle")}</h3>
            {source.ingestRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("sourceDetail.noIngestRuns")}</p>
            ) : (
              <div className="space-y-3">
                {source.ingestRuns.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{run.pipelineName}</p>
                        <p className="text-xs text-muted-foreground break-all">{run.id}</p>
                      </div>
                      <StatusBadge tone={getRunStatusTone(run.status)} label={run.status} />
                    </div>

                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.triggerType")}</p>
                        <p className="text-muted-foreground">{run.triggerType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.startedAt")}</p>
                        <p className="text-muted-foreground">
                          {formatDate(run.startedAt, locale) ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.finishedAt")}</p>
                        <p className="text-muted-foreground">
                          {formatDate(run.finishedAt, locale) ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.itemsFound")}</p>
                        <p className="text-muted-foreground">{run.itemsFound}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.itemsCreated")}</p>
                        <p className="text-muted-foreground">{run.itemsCreated}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.itemsUpdated")}</p>
                        <p className="text-muted-foreground">{run.itemsUpdated}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("ingest.columns.itemsFailed")}</p>
                        <p className="text-muted-foreground">{run.itemsFailed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-semibold text-foreground">{t("sourceDetail.rawItemsTitle")}</h3>
            {source.rawIngestItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("sourceDetail.noRawItems")}</p>
            ) : (
              <div className="space-y-3">
                {source.rawIngestItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {item.rawTitle ?? t("sourceDetail.noRawTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">{item.id}</p>
                      </div>
                      <StatusBadge
                        tone={getRawItemStatusTone(item.status)}
                        label={item.status}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.entityGuess")}
                        </p>
                        <p className="text-muted-foreground">{item.entityGuess}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.ingestedAt")}
                        </p>
                        <p className="text-muted-foreground">
                          {formatDate(item.ingestedAt, locale) ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.processedAt")}
                        </p>
                        <p className="text-muted-foreground">
                          {formatDate(item.processedAt, locale) ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.rawDatetimeText")}
                        </p>
                        <p className="text-muted-foreground">
                          {item.rawDatetimeText ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.rawLocationText")}
                        </p>
                        <p className="text-muted-foreground">
                          {item.rawLocationText ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.languageHint")}
                        </p>
                        <p className="text-muted-foreground">
                          {item.languageHint ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("rawIngest.columns.cityGuess")}
                        </p>
                        <p className="text-muted-foreground">
                          {item.cityGuess ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("rawIngest.columns.source")}</p>
                        <p className="text-muted-foreground break-all">
                          {item.sourceUrl ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("sources.columns.externalId")}</p>
                        <p className="text-muted-foreground break-all">
                          {item.externalId ?? t("sourceDetail.notAvailable")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="font-medium text-foreground">
                        {t("rawIngest.columns.errorMessage")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.errorMessage ?? t("sourceDetail.notAvailable")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
