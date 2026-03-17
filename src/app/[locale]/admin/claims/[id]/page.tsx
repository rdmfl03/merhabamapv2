import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ClaimStatusForm } from "@/components/admin/claim-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminClaimById } from "@/server/queries/admin/get-admin-claim-by-id";

type AdminClaimDetailPageProps = {
  params: Promise<{ locale: "de" | "tr"; id: string }>;
};

export default async function AdminClaimDetailPage({
  params,
}: AdminClaimDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, claim] = await Promise.all([
    getTranslations("admin"),
    getAdminClaimById(id),
  ]);

  if (!claim) {
    notFound();
  }

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/claims`}
      title={t("claimDetail.title")}
      description={t("claimDetail.description")}
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
                <h2 className="font-display text-3xl text-foreground">
                  {claim.place.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {claim.claimantName} • {claim.claimantEmail}
                </p>
              </div>
              <StatusBadge
                tone={
                  claim.status === "PENDING"
                    ? "pending"
                    : claim.status === "APPROVED"
                      ? "success"
                      : "danger"
                }
                label={t(`claimStatuses.${claim.status.toLowerCase()}`)}
              />
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.place")}</p>
                <Link href={`/places/${claim.place.slug}`} className="text-brand">
                  {claim.place.name}
                </Link>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.currentOwner")}</p>
                <p className="text-muted-foreground">
                  {claim.place.owner?.name ??
                    claim.place.owner?.email ??
                    t("claimDetail.noOwner")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.trustState")}</p>
                <p className="text-muted-foreground">
                  {t(`verificationStatuses.${claim.place.verificationStatus.toLowerCase()}`)}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.user")}</p>
                <p className="text-muted-foreground">
                  {claim.user.name ?? claim.user.email ?? t("claimDetail.unknown")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.phone")}</p>
                <p className="text-muted-foreground">
                  {claim.claimantPhone ?? t("claimDetail.noPhone")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.message")}</p>
                <p className="text-muted-foreground">
                  {claim.message ?? t("claimDetail.noMessage")}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("claimDetail.evidence")}</p>
                <p className="text-muted-foreground">
                  {claim.evidenceNotes ?? t("claimDetail.noEvidence")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <h3 className="font-semibold text-foreground">{t("claimDetail.reviewActions")}</h3>
            <Link href={`/admin/places/${claim.place.id}`} className="text-sm text-brand">
              {t("claimDetail.goToPlace")}
            </Link>
            <ClaimStatusForm
              locale={locale}
              claimId={claim.id}
              labels={{
                approve: t("claimDetail.actions.approve"),
                reject: t("claimDetail.actions.reject"),
                success: t("claimDetail.actions.success"),
                error: t("claimDetail.actions.error"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
