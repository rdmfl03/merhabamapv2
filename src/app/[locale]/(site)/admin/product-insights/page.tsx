import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getProductInsightSnapshot } from "@/server/queries/admin/get-product-insight-snapshot";

type ProductInsightsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function ProductInsightsPage({ params }: ProductInsightsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, snapshot] = await Promise.all([
    getTranslations("admin"),
    getProductInsightSnapshot(),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/product-insights`}
      title={t("productInsights.title")}
      description={t("productInsights.description")}
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
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-3 p-6">
            <h2 className="font-semibold text-foreground">{t("productInsights.countsTitle")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("productInsights.countsSince", {
                date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  snapshot.since,
                ),
              })}
            </p>
            {snapshot.countsByName.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("productInsights.empty")}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.countsByName.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-white px-3 py-2"
                  >
                    <span className="font-mono text-xs text-foreground">{row.name}</span>
                    <span className="tabular-nums text-muted-foreground">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-3 p-6">
            <h2 className="font-semibold text-foreground">{t("productInsights.recentTitle")}</h2>
            {snapshot.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("productInsights.empty")}</p>
            ) : (
              <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto text-xs">
                {snapshot.recent.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 font-mono leading-relaxed text-foreground"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>{row.name}</span>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(row.createdAt)}
                      </span>
                    </div>
                    <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all text-[0.65rem] text-muted-foreground">
                      {JSON.stringify(row.payload)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
