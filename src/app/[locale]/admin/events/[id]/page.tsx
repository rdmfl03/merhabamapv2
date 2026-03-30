import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityModerationForm } from "@/components/admin/entity-moderation-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getAdminEventById } from "@/server/queries/admin/get-admin-event-by-id";

type AdminEventDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
};

const allowedAiReviewStatuses = new Set(["ok", "review", "unsure", "reject"]);

function getAiReviewStatusKey(value: string | null | undefined) {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    return "not_checked";
  }

  return allowedAiReviewStatuses.has(normalized) ? normalized : "unknown";
}

function formatDate(value: Date | null | undefined, locale: "de" | "tr") {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminEventDetailPage({
  params,
}: AdminEventDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, event] = await Promise.all([
    getTranslations("admin"),
    getAdminEventById(id),
  ]);

  if (!event) {
    notFound();
  }

  const aiReviewStatusKey = getAiReviewStatusKey(event.aiReviewStatus);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ai-review`}
      title={t("eventDetail.title")}
      description={t("eventDetail.description")}
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
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-foreground">{event.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {getLocalizedCityDisplayName(locale, event.city)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    event.moderationStatus === "APPROVED"
                      ? "success"
                      : event.moderationStatus === "PENDING"
                        ? "warning"
                        : "default"
                  }
                  label={t(`eventDetail.moderationStatuses.${event.moderationStatus.toLowerCase()}`)}
                />
                <StatusBadge
                  tone={event.isPublished ? "success" : "default"}
                  label={t(
                    event.isPublished
                      ? "eventDetail.publicationStatus.published"
                      : "eventDetail.publicationStatus.unpublished",
                  )}
                />
              </div>
            </div>

            {event.moderationStatus === "PENDING" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                  <EntityModerationForm
                    locale={locale}
                    entityType="EVENT"
                    entityId={event.id}
                    labels={{
                      title: t("eventDetail.moderationActions.title"),
                      helper: t("eventDetail.moderationActions.helper"),
                      approve: t("eventDetail.moderationActions.approve"),
                      reject: t("eventDetail.moderationActions.reject"),
                      rejectConfirm: t("eventDetail.moderationActions.rejectConfirm"),
                      rejectCancel: t("eventDetail.moderationActions.rejectCancel"),
                      success: t("eventDetail.moderationActions.success"),
                      error: t("eventDetail.moderationActions.error"),
                      rejectConfirmationRequired: t(
                        "eventDetail.moderationActions.rejectConfirmationRequired",
                      ),
                    }}
                  />
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t("eventDetail.reviewChecklist.title")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("eventDetail.reviewChecklist.description")}
                  </p>
                  {event.submissionContext ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(
                        `eventDetail.originGuidance.${event.submissionContext.origin}`,
                      )}
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>{t("eventDetail.reviewChecklist.items.titlePlausible")}</li>
                    <li>{t("eventDetail.reviewChecklist.items.cityCorrect")}</li>
                    <li>{t("eventDetail.reviewChecklist.items.categoryFits")}</li>
                    <li>
                      {t(
                        event.submissionContext?.origin === "system_submission"
                          ? "eventDetail.reviewChecklist.items.mappingSourceSufficient"
                          : "eventDetail.reviewChecklist.items.sourceSufficient",
                      )}
                    </li>
                    <li>
                      {t(
                        event.submissionContext?.origin === "system_submission"
                          ? "eventDetail.reviewChecklist.items.duplicateAware"
                          : "eventDetail.reviewChecklist.items.dateTimePlausible",
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            ) : null}

            {event.submissionContext ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t("eventDetail.submissionContext.title")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("eventDetail.submissionContext.traceabilityCopy", {
                        origin: t(
                          `submissions.origins.${event.submissionContext.origin}`,
                        ),
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`eventDetail.originGuidance.${event.submissionContext.origin}`)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      event.submissionContext.status === "APPROVED"
                        ? "success"
                        : event.submissionContext.status === "PENDING"
                          ? "warning"
                          : "default"
                    }
                    label={event.submissionContext.status}
                  />
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("eventDetail.submissionContext.origin")}
                    </p>
                    <p className="text-muted-foreground">
                      {t(`submissions.origins.${event.submissionContext.origin}`)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("eventDetail.submissionContext.receivedAt")}
                    </p>
                    <p className="text-muted-foreground">
                      {event.submissionContext.createdAt.toLocaleString(locale)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("eventDetail.submissionContext.source")}
                    </p>
                    <p className="break-all text-muted-foreground">
                      {event.submissionContext.sourceUrl ??
                        t("eventDetail.submissionContext.noSource")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("eventDetail.submissionContext.context")}
                    </p>
                    <p className="text-muted-foreground">
                      {event.submissionContext.compactPayloadSummary ??
                        t("eventDetail.submissionContext.noContext")}
                    </p>
                  </div>
                </div>

                {event.submissionContext.notes ? (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="font-medium text-foreground">
                      {t("eventDetail.submissionContext.notes")}
                    </p>
                    <p className="text-muted-foreground">{event.submissionContext.notes}</p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={event.submissionContext.submissionsListPath}
                    className="text-sm font-medium text-brand"
                  >
                    {t("eventDetail.submissionContext.backToSubmissions")}
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.publicPage")}</p>
                <Link href={`/events/${event.slug}`} className="text-brand">
                  {event.title}
                </Link>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.category")}</p>
                <p className="text-muted-foreground">{event.category}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.startsAt")}</p>
                <p className="text-muted-foreground">
                  {formatDate(event.startsAt, locale) ?? t("eventDetail.noStartsAt")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.endsAt")}</p>
                <p className="text-muted-foreground">
                  {formatDate(event.endsAt, locale) ?? t("eventDetail.noEndsAt")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.venue")}</p>
                <p className="text-muted-foreground">
                  {event.venueName ?? t("eventDetail.noVenue")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.organizer")}</p>
                <p className="text-muted-foreground">
                  {event.organizerName ?? t("eventDetail.noOrganizer")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.externalUrl")}</p>
                <p className="text-muted-foreground break-all">
                  {event.externalUrl ?? t("eventDetail.noExternalUrl")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.moderationStatus")}</p>
                <p className="text-muted-foreground">
                  {t(`eventDetail.moderationStatuses.${event.moderationStatus.toLowerCase()}`)}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.publicationState")}</p>
                <p className="text-muted-foreground">
                  {t(
                    event.isPublished
                      ? "eventDetail.publicationStatus.published"
                      : "eventDetail.publicationStatus.unpublished",
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.aiReviewStatus")}</p>
                <p className="text-muted-foreground">
                  {t(`aiReviewStatuses.${aiReviewStatusKey}`)}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.aiConfidenceScore")}</p>
                <p className="text-muted-foreground">
                  {event.aiConfidenceScore != null
                    ? Number(event.aiConfidenceScore).toFixed(2)
                    : t("eventDetail.aiNotChecked")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("eventDetail.aiLastCheckedAt")}</p>
                <p className="text-muted-foreground">
                  {event.aiLastCheckedAt
                    ? event.aiLastCheckedAt.toLocaleString(locale)
                    : t("eventDetail.aiNotChecked")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/90">
            <CardContent className="space-y-3 p-6">
              <h3 className="font-semibold text-foreground">{t("eventDetail.aiTitle")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("eventDetail.aiDescription")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold text-foreground">{t("eventDetail.reportsTitle")}</h3>
              {event.reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("eventDetail.noReports")}</p>
              ) : (
                <div className="space-y-3">
                  {event.reports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-border p-4">
                      <p className="text-sm font-medium text-foreground">{report.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.status} · {report.createdAt.toLocaleString(locale)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
