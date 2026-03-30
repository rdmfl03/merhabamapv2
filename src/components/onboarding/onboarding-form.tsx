"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveOnboarding } from "@/server/actions/user/save-onboarding";
import { idleUserFormState } from "@/server/actions/user/state";

type Option = {
  value: string;
  label: string;
};

type OnboardingFormProps = {
  locale: "de" | "tr";
  currentLocale: "de" | "tr";
  cities: Array<{ id: string; slug: string; label: string }>;
  interests: Option[];
  selectedInterests?: string[];
  selectedCityId?: string | null;
  labels: {
    languageTitle: string;
    cityTitle: string;
    interestsTitle: string;
    submit: string;
    afterSubmitHint: string;
    success: string;
    error: string;
  };
};

export function OnboardingForm({
  locale,
  currentLocale,
  cities,
  interests,
  selectedInterests = [],
  selectedCityId,
  labels,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    saveOnboarding,
    idleUserFormState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <Card className="bg-white/90">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.languageTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "de", label: "Deutsch" },
                { value: "tr", label: "Türkçe" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4"
                >
                  <input
                    type="radio"
                    name="preferredLocale"
                    value={option.value}
                    defaultChecked={currentLocale === option.value}
                  />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.cityTitle}
            </p>
            <select
              name="cityId"
              required
              defaultValue={selectedCityId ?? cities[0]?.id}
              className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.interestsTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {interests.map((interest) => (
                <label
                  key={interest.value}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4"
                >
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest.value}
                    defaultChecked={selectedInterests.includes(interest.value)}
                  />
                  <span className="text-sm font-medium text-foreground">{interest.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{labels.afterSubmitHint}</p>

          {state.status === "success" ? (
            <p className="text-sm text-green-700">{labels.success}</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-brand">{labels.error}</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {labels.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
