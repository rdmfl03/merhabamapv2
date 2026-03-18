import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminPlaces } from "@/server/queries/admin/list-admin-places";

type AdminPlacesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function AdminPlacesPage({ params }: AdminPlacesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, places] = await Promise.all([
    getTranslations("admin"),
    listAdminPlaces(),
  ]);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/places`}
      title={t("places.title")}
      description={t("places.description")}
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
      <div className="grid gap-4">
        {places.length === 0 ? (
          <Card className="bg-white/90">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t("places.empty")}
            </CardContent>
          </Card>
        ) : (
          places.map((place) => (
            <Card key={place.id} className="bg-white/90">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Link href={`/admin/places/${place.id}`} className="font-semibold text-foreground">
                    {place.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {locale === "tr" ? place.city.nameTr : place.city.nameDe}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {place.owner?.name ?? place.owner?.email ?? t("places.noOwner")}
                  </p>
                  {place.verificationStatus === "CLAIMED" ? (
                    <p className="text-xs text-amber-700">{t("places.claimedFollowUpHint")}</p>
                  ) : null}
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminShell>
  );
}
