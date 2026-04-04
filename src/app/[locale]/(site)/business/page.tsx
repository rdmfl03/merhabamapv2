import { getTranslations, setRequestLocale } from "next-intl/server";

import { BusinessOwnedPlaceCard } from "@/components/business/business-owned-place-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireBusinessUser } from "@/server/actions/business/shared";
import { listOwnedPlaces } from "@/server/queries/business/list-owned-places";

type BusinessOverviewPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function BusinessOverviewPage({
  params,
}: BusinessOverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireBusinessUser(locale);
  const [t, places] = await Promise.all([
    getTranslations("business"),
    listOwnedPlaces(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-foreground">{t("title")}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {places.length === 0 ? (
        <Card className="bg-white/90">
          <CardContent className="space-y-2 p-6">
            <h2 className="font-semibold text-foreground">{t("empty.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {places.map((place) => (
            <BusinessOwnedPlaceCard
              key={place.id}
              locale={locale}
              place={place}
              labels={{
                city: t("card.city"),
                manage: t("card.manage"),
                openPublic: t("card.openPublic"),
                claimed: t("trust.claimedBadge"),
                verified: t("trust.verifiedBadge"),
                lastUpdated: t("card.lastUpdated"),
                notUpdated: t("card.notUpdated"),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
