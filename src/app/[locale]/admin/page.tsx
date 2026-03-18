import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminOverview } from "@/server/queries/admin/get-admin-overview";

type AdminOverviewPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function AdminOverviewPage({
  params,
}: AdminOverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, overview] = await Promise.all([
    getTranslations("admin"),
    getAdminOverview(),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin`}
      title={t("overview.title")}
      description={t("overview.description")}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.openReports")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.openReports}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.pendingClaims")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.pendingClaims}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.inReviewReports")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.inReviewReports}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.verifiedPlaces")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.verifiedPlaces}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.allAiReviewQueue")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.allAiReviewQueueCount}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.eventAiReviewQueue")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.eventAiReviewQueueCount}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("overview.placeAiReviewQueue")}
            </p>
            <p className="font-display text-4xl text-foreground">
              {overview.placeAiReviewQueueCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">{t("overview.launchTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("overview.launchDescription")}</p>
              <p className="text-sm text-muted-foreground">{t("overview.aiQueueDescription")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/reports?status=OPEN`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {t("overview.openReportsAction")}
              </Link>
              <Link
                href={`/admin/claims?status=PENDING`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {t("overview.pendingClaimsAction")}
              </Link>
              <Link
                href={`/admin/places`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {t("overview.trustQueueAction", { count: overview.claimedPlaces })}
              </Link>
              {/* TODO: Replace with dedicated AI moderation page backed by v_ai_review_queue_all */}
              <Link
                href={`/admin/ai-review`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {t("overview.aiQueueAction", { count: overview.allAiReviewQueueCount })}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold text-foreground">{t("overview.playbookTitle")}</h2>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>{t("overview.playbook.reviewClaims")}</li>
              <li>{t("overview.playbook.useVerifiedCarefully")}</li>
              <li>{t("overview.playbook.handleSpam")}</li>
              <li>{t("overview.playbook.checkLinks")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold text-foreground">{t("overview.recentActions")}</h2>
          <div className="space-y-3">
            {overview.recentActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("overview.noActions")}</p>
            ) : (
              overview.recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.actionType} • {action.targetType}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(action.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
