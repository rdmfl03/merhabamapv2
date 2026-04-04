"use client";

import { useEffect, useRef, useActionState } from "react";

import { CategoryVisualKeyChip } from "@/components/media/category-fallback-cover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import { Link, useRouter } from "@/i18n/navigation";
import { saveOnboardingPlaceCategories } from "@/server/actions/user/save-onboarding-place-categories";
import { idleUserFormState } from "@/server/actions/user/state";

type PlaceCategoryGroupOption = {
  value: CategoryFallbackVisualKey;
  label: string;
};

type OnboardingPlacesFormProps = {
  locale: "de" | "tr";
  placeCategoryGroups: PlaceCategoryGroupOption[];
  selectedPlaceCategoryGroups: string[];
  labels: {
    backLink: string;
    placeCategoriesTitle: string;
    submit: string;
    afterSubmitHint: string;
    success: string;
    error: string;
    errorPlaceCategoriesRequired: string;
    errorPlaceCategoriesTooMany: string;
    errorPlaceCategoriesInvalid: string;
    errorBasicsIncomplete: string;
    errorLocaleInvalid: string;
    errorSaveFailed: string;
  };
};

function messageForSubmitError(
  message: string | undefined,
  labels: OnboardingPlacesFormProps["labels"],
): string | null {
  switch (message) {
    case "place_categories_required":
      return labels.errorPlaceCategoriesRequired;
    case "place_categories_too_many":
      return labels.errorPlaceCategoriesTooMany;
    case "place_categories_invalid":
      return labels.errorPlaceCategoriesInvalid;
    case "basics_incomplete":
      return labels.errorBasicsIncomplete;
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

export function OnboardingPlacesForm({
  locale,
  placeCategoryGroups,
  selectedPlaceCategoryGroups,
  labels,
}: OnboardingPlacesFormProps) {
  const router = useRouter();
  const didRedirect = useRef(false);
  const [state, formAction, pending] = useActionState(
    saveOnboardingPlaceCategories,
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

  return (
    <form action={formAction} className="mx-auto w-full max-w-xl space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <p>
        <Link
          href="/onboarding"
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          {labels.backLink}
        </Link>
      </p>
      <Card className="bg-white/90 shadow-soft">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.placeCategoriesTitle}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {placeCategoryGroups.map((row) => (
                <label
                  key={row.value}
                  className="flex min-h-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2"
                >
                  <input
                    type="checkbox"
                    name="placeCategoryGroups"
                    value={row.value}
                    defaultChecked={selectedPlaceCategoryGroups.includes(row.value)}
                  />
                  <CategoryVisualKeyChip visualKey={row.value} />
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
