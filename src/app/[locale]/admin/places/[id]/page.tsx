import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityModerationForm } from "@/components/admin/entity-moderation-form";
import { PlaceTrustStatusForm } from "@/components/admin/place-trust-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminPlaceById } from "@/server/queries/admin/get-admin-place-by-id";

type AdminPlaceDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
};

export default async function AdminPlaceDetailPage({
  params,
}: AdminPlaceDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, place] = await Promise.all([
    getTranslations("admin"),
    getAdminPlaceById(id),
  ]);

  if (!place) {
    notFound();
  }

  const allowedAiReviewStatuses = new Set(["ok", "review", "unsure", "reject"]);
  const normalizedAiReviewStatus = place.aiReviewStatus?.toLowerCase();
  const aiReviewStatusKey = normalizedAiReviewStatus
    ? allowedAiReviewStatuses.has(normalizedAiReviewStatus)
      ? normalizedAiReviewStatus
      : "unknown"
    : "not_checked";

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/places`}
      title={t("placeDetail.title")}
      description={t("placeDetail.description")}
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
                <h2 className="font-display text-3xl text-foreground">{place.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {locale === "tr" ? place.city.nameTr : place.city.nameDe}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    place.moderationStatus === "APPROVED"
                      ? "success"
                      : place.moderationStatus === "PENDING"
                        ? "warning"
                        : "default"
                  }
                  label={t(`placeDetail.moderationStatuses.${place.moderationStatus.toLowerCase()}`)}
                />
                <StatusBadge
                  tone={place.isPublished ? "success" : "default"}
                  label={t(
                    place.isPublished
                      ? "placeDetail.publicationStatus.published"
                      : "placeDetail.publicationStatus.unpublished",
                  )}
                />
                <StatusBadge
                  tone={
                    place.verificationStatus === "VERIFIED"
                      ? "success"
                      : place.verificationStatus === "CLAIMED"
                        ? "warning"
                        : "default"
                  }
                  label={t(`verificationStatuses.${place.verificationStatus.toLowerCase()}`)}
                />
              </div>
            </div>

            {place.moderationStatus === "PENDING" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                  <EntityModerationForm
                    locale={locale}
                    entityType="PLACE"
                    entityId={place.id}
                    labels={{
                      title: t("placeDetail.moderationActions.title"),
                      helper: t("placeDetail.moderationActions.helper"),
                      approve: t("placeDetail.moderationActions.approve"),
                      reject: t("placeDetail.moderationActions.reject"),
                      rejectConfirm: t("placeDetail.moderationActions.rejectConfirm"),
                      rejectCancel: t("placeDetail.moderationActions.rejectCancel"),
                      success: t("placeDetail.moderationActions.success"),
                      error: t("placeDetail.moderationActions.error"),
                      rejectConfirmationRequired: t(
                        "placeDetail.moderationActions.rejectConfirmationRequired",
                      ),
                    }}
                  />
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t("placeDetail.reviewChecklist.title")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("placeDetail.reviewChecklist.description")}
                  </p>
                  {place.submissionContext ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(
                        `placeDetail.originGuidance.${place.submissionContext.origin}`,
                      )}
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>{t("placeDetail.reviewChecklist.items.namePlausible")}</li>
                    <li>{t("placeDetail.reviewChecklist.items.cityCorrect")}</li>
                    <li>{t("placeDetail.reviewChecklist.items.categoryFits")}</li>
                    <li>
                      {t(
                        place.submissionContext?.origin === "system_submission"
                          ? "placeDetail.reviewChecklist.items.mappingSourceSufficient"
                          : "placeDetail.reviewChecklist.items.sourceSufficient",
                      )}
                    </li>
                    <li>
                      {t(
                        place.submissionContext?.origin === "system_submission"
                          ? "placeDetail.reviewChecklist.items.duplicateAware"
                          : "placeDetail.reviewChecklist.items.addressPlausible",
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            ) : null}

            {place.submissionContext ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t("placeDetail.submissionContext.title")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("placeDetail.submissionContext.traceabilityCopy", {
                        origin: t(
                          `submissions.origins.${place.submissionContext.origin}`,
                        ),
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`placeDetail.originGuidance.${place.submissionContext.origin}`)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      tone={
                        place.submissionContext.status === "APPROVED"
                          ? "success"
                          : place.submissionContext.status === "PENDING"
                            ? "warning"
                            : "default"
                      }
                      label={place.submissionContext.status}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("placeDetail.submissionContext.origin")}
                    </p>
                    <p className="text-muted-foreground">
                      {t(`submissions.origins.${place.submissionContext.origin}`)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("placeDetail.submissionContext.receivedAt")}
                    </p>
                    <p className="text-muted-foreground">
                      {place.submissionContext.createdAt.toLocaleString(locale)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("placeDetail.submissionContext.source")}
                    </p>
                    <p className="break-all text-muted-foreground">
                      {place.submissionContext.sourceUrl ??
                        t("placeDetail.submissionContext.noSource")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("placeDetail.submissionContext.context")}
                    </p>
                    <p className="text-muted-foreground">
                      {place.submissionContext.compactPayloadSummary ??
                        t("placeDetail.submissionContext.noContext")}
                    </p>
                  </div>
                </div>

                {place.submissionContext.notes ? (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="font-medium text-foreground">
                      {t("placeDetail.submissionContext.notes")}
                    </p>
                    <p className="text-muted-foreground">{place.submissionContext.notes}</p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={place.submissionContext.submissionsListPath}
                    className="text-sm font-medium text-brand"
                  >
                    {t("placeDetail.submissionContext.backToSubmissions")}
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.publicPage")}</p>
                <Link href={`/places/${place.slug}`} className="text-brand">
                  {place.name}
                </Link>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.owner")}</p>
                <p className="text-muted-foreground">
                  {place.owner?.name ?? place.owner?.email ?? t("placeDetail.noOwner")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.phone")}</p>
                <p className="text-muted-foreground">
                  {place.phone ?? t("placeDetail.noPhone")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.website")}</p>
                <p className="text-muted-foreground">
                  {place.websiteUrl ?? t("placeDetail.noWebsite")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.moderationStatus")}</p>
                <p className="text-muted-foreground">
                  {t(`placeDetail.moderationStatuses.${place.moderationStatus.toLowerCase()}`)}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.publicationState")}</p>
                <p className="text-muted-foreground">
                  {t(
                    place.isPublished
                      ? "placeDetail.publicationStatus.published"
                      : "placeDetail.publicationStatus.unpublished",
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.lastVerified")}</p>
                <p className="text-muted-foreground">
                  {place.verifiedAt
                    ? place.verifiedAt.toLocaleDateString(locale)
                    : t("placeDetail.notVerified")}
                </p>
                {place.verificationStatus === "CLAIMED" ? (
                  <p className="mt-1 text-xs text-amber-700">
                    {t("placeDetail.claimedFollowUpHint")}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.aiReviewStatus")}</p>
                <p className="text-muted-foreground">
                  {t(`aiReviewStatuses.${aiReviewStatusKey}`)}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.aiConfidenceScore")}</p>
                <p className="text-muted-foreground">
                  {place.aiConfidenceScore != null
                    ? Number(place.aiConfidenceScore).toFixed(2)
                    : t("placeDetail.aiNotChecked")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("placeDetail.aiLastCheckedAt")}</p>
                <p className="text-muted-foreground">
                  {place.aiLastCheckedAt
                    ? place.aiLastCheckedAt.toLocaleString(locale)
                    : t("placeDetail.aiNotChecked")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/90">
            <CardContent className="space-y-5 p-6">
              <h3 className="font-semibold text-foreground">{t("placeDetail.trustActions")}</h3>
              <PlaceTrustStatusForm
                locale={locale}
                placeId={place.id}
                labels={{
                  unverified: t("placeDetail.actions.unverified"),
                  claimed: t("placeDetail.actions.claimed"),
                  verified: t("placeDetail.actions.verified"),
                  success: t("placeDetail.actions.success"),
                  error: t("placeDetail.actions.error"),
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="space-y-3 p-6">
              <h3 className="font-semibold text-foreground">{t("placeDetail.aiTitle")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("placeDetail.aiDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
