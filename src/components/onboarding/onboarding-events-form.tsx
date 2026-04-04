"use client";

import type { EventCategory } from "@prisma/client";
import { useEffect, useRef, useActionState } from "react";

import { CategoryVisualKeyChip } from "@/components/media/category-fallback-cover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import { Link, useRouter } from "@/i18n/navigation";
import { saveOnboardingEventCategories } from "@/server/actions/user/save-onboarding-event-categories";
import { idleUserFormState } from "@/server/actions/user/state";

type EventCategoryOption = {
  value: EventCategory;
  label: string;
  visualKey: CategoryFallbackVisualKey;
};

type OnboardingEventsFormProps = {
  locale: "de" | "tr";
  eventCategories: EventCategoryOption[];
  selectedEventCategories: EventCategory[];
  labels: {
    backLink: string;
    eventCategoriesTitle: string;
    submit: string;
    afterSubmitHint: string;
    success: string;
    error: string;
    errorEventCategoriesRequired: string;
    errorEventCategoriesTooMany: string;
    errorEventCategoriesInvalid: string;
    errorBasicsIncomplete: string;
    errorPlacesStepIncomplete: string;
    errorLocaleInvalid: string;
    errorSaveFailed: string;
  };
};

function messageForSubmitError(
  message: string | undefined,
  labels: OnboardingEventsFormProps["labels"],
): string | null {
  switch (message) {
    case "event_categories_required":
      return labels.errorEventCategoriesRequired;
    case "event_categories_too_many":
      return labels.errorEventCategoriesTooMany;
    case "event_categories_invalid":
      return labels.errorEventCategoriesInvalid;
    case "basics_incomplete":
      return labels.errorBasicsIncomplete;
    case "places_step_incomplete":
      return labels.errorPlacesStepIncomplete;
    case "locale_invalid":
      return labels.errorLocaleInvalid;
    case "save_failed":
      return labels.errorSaveFailed;
    case "validation_error":
      return labels.error;
    default:
      return null;
  }
}

export function OnboardingEventsForm({
  locale,
  eventCategories,
  selectedEventCategories,
  labels,
}: OnboardingEventsFormProps) {
  const router = useRouter();
  const didRedirect = useRef(false);
  const [state, formAction, pending] = useActionState(
    saveOnboardingEventCategories,
    idleUserFormState,
  );

  useEffect(() => {
    if (state.status !== "success" || !state.redirectTo || didRedirect.current) {
      return;
    }

    didRedirect.current = true;
    router.replace(state.redirectTo);
    router.refresh();
  }, [router, state.redirectTo, state.status]);

  const submitError =
    state.status === "error"
      ? (messageForSubmitError(state.message, labels) ?? labels.error)
      : null;

  const selectedSet = new Set(selectedEventCategories);

  return (
    <form action={formAction} className="mx-auto w-full max-w-xl space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <p>
        <Link
          href="/onboarding/places"
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          {labels.backLink}
        </Link>
      </p>
      <Card className="bg-white/90 shadow-soft">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.eventCategoriesTitle}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {eventCategories.map((row) => (
                <label
                  key={row.value}
                  className="flex min-h-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2"
                >
                  <input
                    type="checkbox"
                    name="eventCategories"
                    value={row.value}
                    defaultChecked={selectedSet.has(row.value)}
                  />
                  <CategoryVisualKeyChip visualKey={row.visualKey} />
                  <span className="text-sm font-medium text-foreground">{row.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{labels.afterSubmitHint}</p>

          {state.status === "success" && state.redirectTo ? (
            <p className="text-sm text-green-700">{labels.success}</p>
          ) : null}
          {submitError ? (
            <p className="text-sm text-brand" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-center">
            <Button type="submit" disabled={pending}>
              {labels.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
