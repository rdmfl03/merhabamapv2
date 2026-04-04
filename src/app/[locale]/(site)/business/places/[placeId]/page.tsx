import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BusinessPlaceForm } from "@/components/business/business-place-form";
import { PlaceTrustBadge, PlaceTrustHelper } from "@/components/places/place-trust-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { requireBusinessUser, requireOwnedPlaceAccess } from "@/server/actions/business/shared";
import { getOwnedPlaceById } from "@/server/queries/business/get-owned-place-by-id";

type BusinessPlacePageProps = {
  params: Promise<{ locale: "de" | "tr"; placeId: string }>;
};

export default async function BusinessPlacePage({
  params,
}: BusinessPlacePageProps) {
  const { locale, placeId } = await params;
  setRequestLocale(locale);

  const user = await requireBusinessUser(locale);
  await requireOwnedPlaceAccess({ locale, placeId });

  const [t, place] = await Promise.all([
    getTranslations("business"),
    getOwnedPlaceById(placeId, user.id),
  ]);

  if (!place) {
    notFound();
  }

  const cityLabel = getLocalizedCityDisplayName(locale, place.city);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("eyebrow")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl text-foreground">{place.name}</h1>
          <PlaceTrustBadge
            status={place.verificationStatus}
            labels={{
              claimed: t("trust.claimedBadge"),
              verified: t("trust.verifiedBadge"),
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {cityLabel} • {t("placePage.subtitle")}
        </p>
      </div>

      <PlaceTrustHelper
        status={place.verificationStatus}
        labels={{
          claimedTitle: t("trust.claimedTitle"),
          claimedDescription: t("trust.claimedDescription"),
          verifiedTitle: t("trust.verifiedTitle"),
          verifiedDescription: t("trust.verifiedDescription"),
        }}
      />

      <Card className="bg-white/90">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-semibold text-foreground">{t("placePage.boundariesTitle")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("placePage.boundariesDescription")}
          </p>
        </CardContent>
      </Card>

      <BusinessPlaceForm
        locale={locale}
        place={place}
        labels={{
          title: t("form.title"),
          description: t("form.description"),
          phone: t("form.phone"),
          website: t("form.website"),
          descriptionDe: t("form.descriptionDe"),
          descriptionTr: t("form.descriptionTr"),
          openingHours: t("form.openingHours"),
          openingHoursHint: t("form.openingHoursHint"),
          submit: t("form.submit"),
          success: t("form.success"),
          error: t("form.error"),
        }}
      />
    </div>
  );
}
