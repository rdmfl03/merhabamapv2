import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAuthenticatedUser } from "@/server/actions/user/shared";
import { getSavedPlaces } from "@/server/queries/user/get-saved-places";
import { PlaceCard } from "@/components/places/place-card";
import { SavedEmptyState } from "@/components/saved/saved-empty-state";
import { getLocalizedPlaceCategoryLabel, getLocalizedText } from "@/lib/places";

type SavedPlacesPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function SavedPlacesPage({ params }: SavedPlacesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuthenticatedUser(locale);
  const [t, savedPlaces] = await Promise.all([
    getTranslations("saved"),
    getSavedPlaces(user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {t("places.eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-foreground">{t("places.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("places.description")}</p>
      </div>

      {savedPlaces.length === 0 ? (
        <SavedEmptyState
          title={t("places.emptyTitle")}
          description={t("places.emptyDescription")}
          ctaLabel={t("places.cta")}
          href={`/${locale}/places`}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {savedPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              locale={locale}
              description={getLocalizedText(
                { de: place.descriptionDe, tr: place.descriptionTr },
                locale,
                t("places.fallbackDescription"),
              )}
              categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
              cityLabel={locale === "tr" ? place.city.nameTr : place.city.nameDe}
              returnPath={`/${locale}/saved/places`}
              isAuthenticated
              labels={{
                details: t("common.details"),
                save: t("common.save"),
                saved: t("common.saved"),
                saving: t("common.saving"),
                signIn: t("common.signIn"),
                verified: t("common.verified"),
              }}
              />
          ))}
        </div>
      )}
    </div>
  );
}
