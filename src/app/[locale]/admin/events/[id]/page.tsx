import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
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
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-foreground">{event.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {locale === "tr" ? event.city.nameTr : event.city.nameDe}
                </p>
              </div>
              <StatusBadge
                tone={
                  event.isPublished && event.moderationStatus === "APPROVED"
                    ? "success"
                    : event.moderationStatus === "PENDING"
                      ? "warning"
                      : "default"
                }
                label={t(
                  event.isPublished
                    ? "eventDetail.publicationStatus.published"
                    : "eventDetail.publicationStatus.unpublished",
                )}
              />
            </div>

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
                <p className="text-muted-foreground">{event.moderationStatus}</p>
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
