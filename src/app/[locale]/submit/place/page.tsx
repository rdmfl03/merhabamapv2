import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { PlaceSubmissionForm } from "@/components/submissions/place-submission-form";
import { getLocalizedPlaceCategoryLabel } from "@/lib/places";
import { getSubmissionFormOptions } from "@/server/queries/submissions/get-submission-form-options";

type SubmitPlacePageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function SubmitPlacePage({ params }: SubmitPlacePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, session, options] = await Promise.all([
    getTranslations("submissions"),
    auth(),
    getSubmissionFormOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-7 sm:py-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          {t("place.eyebrow")}
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {t("place.pageTitle")}
          </h1>
          <p className="max-w-2xl text-base leading-6 text-muted-foreground">
            {t("place.pageDescription")}
          </p>
        </div>
      </section>

      <PlaceSubmissionForm
        locale={locale}
        isAuthenticated={Boolean(session?.user?.id)}
        signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/submit/place`)}`}
        cities={options.cities.map((city) => ({
          id: city.id,
          slug: city.slug,
          label: locale === "tr" ? city.nameTr : city.nameDe,
        }))}
        categories={options.placeCategories.map((category) => ({
          id: category.id,
          label: getLocalizedPlaceCategoryLabel(category, locale),
        }))}
        existingPlaces={options.existingPlaces}
        labels={{
          title: t("place.form.title"),
          description: t("place.form.description"),
          signInTitle: t("common.signInTitle"),
          signInDescription: t("common.signInDescription"),
          signIn: t("common.signIn"),
          requiredHint: t("common.requiredHint"),
          fields: {
            name: t("place.form.fields.name"),
            city: t("place.form.fields.city"),
            category: t("place.form.fields.category"),
            addressLine1: t("place.form.fields.addressLine1"),
            sourceUrl: t("place.form.fields.sourceUrl"),
            description: t("place.form.fields.description"),
            note: t("place.form.fields.note"),
          },
          placeholders: {
            name: t("place.form.placeholders.name"),
            addressLine1: t("place.form.placeholders.addressLine1"),
            sourceUrl: t("place.form.placeholders.sourceUrl"),
            description: t("place.form.placeholders.description"),
            note: t("place.form.placeholders.note"),
          },
          submit: t("place.form.submit"),
          success: {
            title: t("place.success.title"),
            body: t("place.success.body"),
            backToCity: t("place.success.backToCity"),
            submitAnother: t("place.success.submitAnother"),
          },
          review: {
            title: t("common.review.title"),
            city: t("common.review.city"),
            category: t("common.review.category"),
            source: t("common.review.source"),
            sourcePresent: t("common.review.sourcePresent"),
            sourceMissing: t("common.review.sourceMissing"),
            warningsTitle: t("common.review.warningsTitle"),
            noWarnings: t("common.review.noWarnings"),
            duplicateHint: t("common.review.placeDuplicateHint"),
          },
          warnings: {
            missingSource: t("common.warnings.missingSource"),
            shortDescription: t("common.warnings.shortDescription"),
            possibleDuplicate: t("common.warnings.possibleDuplicate"),
          },
          errors: {
            validation_error: t("common.errors.validation"),
            name_required: t("place.form.errors.name"),
            city_required: t("place.form.errors.city"),
            city_not_allowed: t("place.form.errors.city"),
            category_required: t("place.form.errors.category"),
            category_not_allowed: t("place.form.errors.category"),
            description_required: t("place.form.errors.description"),
            address_or_source_required: t("place.form.errors.addressOrSource"),
            source_url_invalid: t("place.form.errors.sourceUrl"),
            note_too_long: t("place.form.errors.note"),
            suggestion_cooldown: t("common.errors.cooldown"),
            suggestion_daily_limit: t("common.errors.dailyLimit"),
            duplicate_submission: t("common.errors.duplicate"),
          },
        }}
      />
    </div>
  );
}
