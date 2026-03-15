import { ClaimStatus } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminClaims } from "@/server/queries/admin/list-admin-claims";

type AdminClaimsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminClaimsPage({
  params,
  searchParams,
}: AdminClaimsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const status =
    typeof rawSearchParams.status === "string" &&
    rawSearchParams.status in ClaimStatus
      ? (rawSearchParams.status as ClaimStatus)
      : undefined;

  const [t, claims] = await Promise.all([
    getTranslations("admin"),
    listAdminClaims({ status }),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/claims`}
      title={t("claims.title")}
      description={t("claims.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href={`/${locale}/admin/claims`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("claims.filters.reset")}
            </a>
            <a
              href={`/${locale}/admin/claims?status=PENDING`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("claims.filters.pending")}
            </a>
            <a
              href={`/${locale}/admin/claims?status=APPROVED`}
              className="rounded-2xl border border-border px-4 py-3 text-sm text-foreground"
            >
              {t("claims.filters.approved")}
            </a>
          </div>

          <div className="space-y-3">
            {claims.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("claims.empty")}</p>
            ) : (
              claims.map((claim) => (
                <Link
                  key={claim.id}
                  href={`/admin/claims/${claim.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{claim.place.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {claim.claimantName} • {claim.claimantEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(claim.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
