import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
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
                <p className="font-medium text-foreground">{t("placeDetail.lastVerified")}</p>
                <p className="text-muted-foreground">
                  {place.verifiedAt
                    ? place.verifiedAt.toLocaleDateString(locale)
                    : t("placeDetail.notVerified")}
                </p>
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
