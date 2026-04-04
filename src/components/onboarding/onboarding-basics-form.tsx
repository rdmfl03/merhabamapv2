"use client";

import { useEffect, useRef, useState, useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { checkOnboardingUsernameAvailability } from "@/server/actions/user/check-onboarding-username";
import { saveOnboardingBasics } from "@/server/actions/user/save-onboarding-basics";
import { idleUserFormState } from "@/server/actions/user/state";

type UsernameBlurState =
  | "idle"
  | "checking"
  | "invalid"
  | "taken"
  | "available";

type OnboardingBasicsFormProps = {
  locale: "de" | "tr";
  /** Saved profile language preference, or current page locale if unset. */
  defaultPreferredLocale: "de" | "tr";
  cities: Array<{ id: string; slug: string; label: string }>;
  selectedCityId?: string | null;
  defaultUsername?: string | null;
  labels: {
    languageTitle: string;
    languageDescription: string;
    usernameTitle: string;
    usernameHint: string;
    usernamePlaceholder: string;
    usernameAvailableHint: string;
    usernameChecking: string;
    cityTitle: string;
    submit: string;
    afterSubmitHint: string;
    success: string;
    error: string;
    errorUsernameTaken: string;
    errorUsernameInvalid: string;
    errorCityInvalid: string;
    errorLocaleInvalid: string;
    errorSaveFailed: string;
  };
};

const usernameWarnClass =
  "border-brand/45 ring-2 ring-brand/15 focus-visible:border-brand/55 focus-visible:ring-brand/25";
const usernameOkClass =
  "border-emerald-400/50 ring-2 ring-emerald-500/15 focus-visible:border-emerald-500/60";
const fieldErrorClass =
  "border-brand/55 ring-2 ring-brand/20 focus-visible:border-brand/65 focus-visible:ring-brand/25";

function messageForSubmitError(
  message: string | undefined,
  labels: OnboardingBasicsFormProps["labels"],
): string | null {
  switch (message) {
    case "username_taken":
      return labels.errorUsernameTaken;
    case "username_invalid":
      return labels.errorUsernameInvalid;
    case "city_invalid":
    case "city_not_found":
      return labels.errorCityInvalid;
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

function resolveSelectDefault(
  selectedCityId: string | null | undefined,
  cities: OnboardingBasicsFormProps["cities"],
): string {
  if (selectedCityId && cities.some((c) => c.id === selectedCityId)) {
    return selectedCityId;
  }
  return cities[0]?.id ?? "";
}

export function OnboardingBasicsForm({
  locale,
  defaultPreferredLocale,
  cities,
  selectedCityId,
  defaultUsername,
  labels,
}: OnboardingBasicsFormProps) {
  const router = useRouter();
  const didRedirect = useRef(false);
  const usernameCheckSeq = useRef(0);
  const [usernameBlur, setUsernameBlur] = useState<UsernameBlurState>("idle");
  const [state, formAction, pending] = useActionState(
    saveOnboardingBasics,
    idleUserFormState,
  );

  const cityFieldError =
    state.status === "error" &&
    (state.message === "city_invalid" || state.message === "city_not_found");

  useEffect(() => {
    if (state.status !== "success" || !state.redirectTo || didRedirect.current) {
      return;
    }

    didRedirect.current = true;
    router.replace(state.redirectTo);
    router.refresh();
  }, [router, state.redirectTo, state.status]);

  useEffect(() => {
    if (state.message === "username_taken") {
      setUsernameBlur("taken");
    } else if (state.message === "username_invalid") {
      setUsernameBlur("invalid");
    }
  }, [state.message]);

  const handleUsernameChange = () => {
    usernameCheckSeq.current += 1;
    setUsernameBlur("idle");
  };

  const handleUsernameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (!value) {
      setUsernameBlur("idle");
      return;
    }

    const seq = ++usernameCheckSeq.current;
    setUsernameBlur("checking");

    const result = await checkOnboardingUsernameAvailability({
      locale,
      username: value,
    });

    if (seq !== usernameCheckSeq.current) {
      return;
    }

    if (result.status === "empty") {
      setUsernameBlur("idle");
      return;
    }

    if (result.status === "invalid") {
      setUsernameBlur("invalid");
      return;
    }

    if (result.status === "taken") {
      setUsernameBlur("taken");
      return;
    }

    setUsernameBlur("available");
  };

  const submitError =
    state.status === "error"
      ? (messageForSubmitError(state.message, labels) ?? labels.error)
      : null;

  const usernameInline =
    usernameBlur === "checking"
      ? labels.usernameChecking
      : usernameBlur === "invalid"
        ? labels.errorUsernameInvalid
        : usernameBlur === "taken"
          ? labels.errorUsernameTaken
          : usernameBlur === "available"
            ? labels.usernameAvailableHint
            : null;

  const usernameInputClass = cn(
    "w-full max-w-full sm:max-w-md",
    usernameBlur === "invalid" || usernameBlur === "taken" ? usernameWarnClass : null,
    usernameBlur === "available" ? usernameOkClass : null,
  );

  const selectDefault = resolveSelectDefault(selectedCityId, cities);

  return (
    <form action={formAction} className="mx-auto w-full max-w-xl space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Card className="bg-white/90 shadow-soft">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.languageTitle}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">{labels.languageDescription}</p>
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
                    defaultChecked={defaultPreferredLocale === option.value}
                  />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.usernameTitle}
            </p>
            <Input
              name="username"
              required
              minLength={3}
              maxLength={32}
              autoComplete="username"
              spellCheck={false}
              defaultValue={defaultUsername ?? ""}
              placeholder={labels.usernamePlaceholder}
              className={usernameInputClass}
              aria-invalid={usernameBlur === "invalid" || usernameBlur === "taken"}
              onChange={handleUsernameChange}
              onBlur={handleUsernameBlur}
            />
            <p className="text-xs leading-5 text-muted-foreground">{labels.usernameHint}</p>
            {usernameInline ? (
              <p
                className={cn(
                  "text-sm",
                  usernameBlur === "available"
                    ? "text-emerald-800"
                    : usernameBlur === "checking"
                      ? "text-muted-foreground"
                      : "text-brand",
                )}
                role="status"
                aria-live="polite"
              >
                {usernameInline}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {labels.cityTitle}
            </p>
            <select
              name="cityId"
              required
              defaultValue={selectDefault}
              aria-invalid={cityFieldError}
              className={cn(
                "flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                cityFieldError ? fieldErrorClass : null,
              )}
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}
                </option>
              ))}
            </select>
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
            <Button
              type="submit"
              disabled={pending || usernameBlur === "taken" || usernameBlur === "invalid"}
            >
              {labels.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
