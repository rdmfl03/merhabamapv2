import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { EventSubmissionForm } from "@/components/submissions/event-submission-form";
import { getEventCategoryLabelKey } from "@/lib/events";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { getBerlinDateInputValue } from "@/lib/submissions";
import { getSubmissionFormOptions } from "@/server/queries/submissions/get-submission-form-options";

type SubmitEventPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function SubmitEventPage({ params }: SubmitEventPageProps) {
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
          {t("event.eyebrow")}
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {t("event.pageTitle")}
          </h1>
          <p className="max-w-2xl text-base leading-6 text-muted-foreground">
            {t("event.pageDescription")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-4">
        <p className="text-sm font-semibold text-foreground">
          {t("common.expectation.title")}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("common.expectation.description")}
        </p>
      </section>

      <EventSubmissionForm
        locale={locale}
        isAuthenticated={Boolean(session?.user?.id)}
        signInHref={`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/submit/event`)}`}
        cities={options.cities.map((city) => ({
          id: city.id,
          slug: city.slug,
          label: getLocalizedCityDisplayName(locale, city),
        }))}
        categories={options.eventCategories.map((category) => ({
          value: category,
          label: t(`event.categories.${getEventCategoryLabelKey(category)}`),
        }))}
        existingEvents={options.existingEvents.map((event) => ({
          title: event.title,
          cityId: event.cityId,
          date: getBerlinDateInputValue(event.startsAt),
        }))}
        labels={{
          title: t("event.form.title"),
          description: t("event.form.description"),
          signInTitle: t("common.signInTitle"),
          signInDescription: t("common.signInDescription"),
          signIn: t("common.signIn"),
          requiredHint: t("common.requiredHint"),
          fields: {
            title: t("event.form.fields.title"),
            city: t("event.form.fields.city"),
            category: t("event.form.fields.category"),
            date: t("event.form.fields.date"),
            time: t("event.form.fields.time"),
            venueName: t("event.form.fields.venueName"),
            addressLine1: t("event.form.fields.addressLine1"),
            sourceUrl: t("event.form.fields.sourceUrl"),
            description: t("event.form.fields.description"),
            note: t("event.form.fields.note"),
          },
          placeholders: {
            title: t("event.form.placeholders.title"),
            venueName: t("event.form.placeholders.venueName"),
            addressLine1: t("event.form.placeholders.addressLine1"),
            sourceUrl: t("event.form.placeholders.sourceUrl"),
            description: t("event.form.placeholders.description"),
            note: t("event.form.placeholders.note"),
          },
          submit: t("event.form.submit"),
          success: {
            title: t("event.success.title"),
            body: t("event.success.body"),
            backToCity: t("event.success.backToCity"),
            submitAnother: t("event.success.submitAnother"),
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
            duplicateHint: t("common.review.eventDuplicateHint"),
          },
          warnings: {
            shortDescription: t("common.warnings.shortDescription"),
            eventMissingTime: t("common.warnings.eventMissingTime"),
            possibleDuplicate: t("common.warnings.possibleDuplicate"),
          },
          errors: {
            validation_error: t("common.errors.validation"),
            title_required: t("event.form.errors.title"),
            city_required: t("event.form.errors.city"),
            city_not_allowed: t("event.form.errors.city"),
            category_required: t("event.form.errors.category"),
            date_required: t("event.form.errors.date"),
            date_invalid: t("event.form.errors.date"),
            time_invalid: t("event.form.errors.time"),
            venue_or_address_required: t("event.form.errors.venueOrAddress"),
            source_url_required: t("event.form.errors.sourceUrl"),
            source_url_invalid: t("event.form.errors.sourceUrl"),
            description_required: t("event.form.errors.description"),
            suggestion_cooldown: t("common.errors.cooldown"),
            suggestion_daily_limit: t("common.errors.dailyLimit"),
            duplicate_submission: t("common.errors.duplicate"),
          },
        }}
      />
    </div>
  );
}
