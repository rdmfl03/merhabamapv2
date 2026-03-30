"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { normalizeSubmissionText } from "@/lib/submissions";
import {
  idleSubmissionActionState,
  type SubmissionActionState,
} from "@/server/actions/submissions/state";
import { submitPlaceSuggestion } from "@/server/actions/submissions/submit-place-suggestion";

type PlaceSubmissionFormProps = {
  locale: "de" | "tr";
  isAuthenticated: boolean;
  signInHref: string;
  cities: Array<{ id: string; slug: string; label: string }>;
  categories: Array<{ id: string; label: string }>;
  existingPlaces: Array<{ name: string; cityId: string }>;
  labels: {
    title: string;
    description: string;
    signInTitle: string;
    signInDescription: string;
    signIn: string;
    requiredHint: string;
    fields: {
      name: string;
      city: string;
      category: string;
      addressLine1: string;
      sourceUrl: string;
      description: string;
      note: string;
    };
    placeholders: {
      name: string;
      addressLine1: string;
      sourceUrl: string;
      description: string;
      note: string;
    };
    submit: string;
    success: {
      title: string;
      body: string;
      backToCity: string;
      submitAnother: string;
    };
    review: {
      title: string;
      city: string;
      category: string;
      source: string;
      sourcePresent: string;
      sourceMissing: string;
      warningsTitle: string;
      noWarnings: string;
      duplicateHint: string;
    };
    warnings: {
      missingSource: string;
      shortDescription: string;
      possibleDuplicate: string;
    };
    errors: Record<string, string>;
  };
};

function PlaceSubmissionFormInner({
  locale,
  signInHref,
  isAuthenticated,
  cities,
  categories,
  existingPlaces,
  labels,
  onReset,
}: PlaceSubmissionFormProps & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState<SubmissionActionState, FormData>(
    submitPlaceSuggestion,
    idleSubmissionActionState,
  );
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const fieldError = (field: string) =>
    state.fieldErrors?.[field]?.[0]
      ? labels.errors[state.fieldErrors[field]?.[0] as keyof typeof labels.errors] ??
        labels.errors.validation_error
      : null;
  const normalizedName = normalizeSubmissionText(name);
  const duplicateHint =
    normalizedName && cityId
      ? existingPlaces.some(
          (place) =>
            place.cityId === cityId &&
            normalizeSubmissionText(place.name) === normalizedName,
        )
      : false;
  const softWarnings = [
    !sourceUrl.trim() ? labels.warnings.missingSource : null,
    description.trim().length > 0 && description.trim().length < 60
      ? labels.warnings.shortDescription
      : null,
    duplicateHint ? labels.warnings.possibleDuplicate : null,
  ].filter((warning): warning is string => Boolean(warning));

  if (!isAuthenticated) {
    return (
      <Card className="bg-white/90">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{labels.signInTitle}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{labels.signInDescription}</p>
          </div>
          <Button asChild>
            <Link href={signInHref}>{labels.signIn}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "success" && state.submitted) {
    return (
      <Card className="bg-white/90">
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">{labels.success.title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {labels.success.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/cities/${encodeURIComponent(state.submitted.citySlug)}`}>
                {labels.success.backToCity}
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              {labels.success.submitAnother}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90">
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{labels.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{labels.description}</p>
          <p className="text-xs font-medium text-muted-foreground">{labels.requiredHint}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnPath" value={`/${locale}/submit/place`} />

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.fields.name}</span>
            <Input
              name="name"
              maxLength={140}
              placeholder={labels.placeholders.name}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {fieldError("name") ? <p className="text-sm text-brand">{fieldError("name")}</p> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.fields.city}</span>
              <select
                name="cityId"
                required
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
              {fieldError("cityId") ? <p className="text-sm text-brand">{fieldError("cityId")}</p> : null}
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.fields.category}</span>
              <select
                name="categoryId"
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              {fieldError("categoryId") ? (
                <p className="text-sm text-brand">{fieldError("categoryId")}</p>
              ) : null}
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.fields.addressLine1}</span>
            <Input
              name="addressLine1"
              maxLength={180}
              placeholder={labels.placeholders.addressLine1}
            />
            {fieldError("addressLine1") ? (
              <p className="text-sm text-brand">{fieldError("addressLine1")}</p>
            ) : null}
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.fields.sourceUrl}</span>
            <Input
              type="url"
              name="sourceUrl"
              maxLength={300}
              placeholder={labels.placeholders.sourceUrl}
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
            {fieldError("sourceUrl") ? (
              <p className="text-sm text-brand">{fieldError("sourceUrl")}</p>
            ) : null}
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.fields.description}</span>
            <Textarea
              name="description"
              maxLength={1200}
              placeholder={labels.placeholders.description}
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {fieldError("description") ? (
              <p className="text-sm text-brand">{fieldError("description")}</p>
            ) : null}
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.fields.note}</span>
            <Textarea
              name="note"
              maxLength={1000}
              placeholder={labels.placeholders.note}
            />
            {fieldError("note") ? <p className="text-sm text-brand">{fieldError("note")}</p> : null}
          </label>

          {state.status === "error" && state.message && !state.fieldErrors ? (
            <p className="text-sm text-brand">
              {labels.errors[state.message as keyof typeof labels.errors] ?? labels.errors.validation_error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-border/80 bg-[#f8fafc] px-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{labels.review.title}</p>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-medium text-foreground">{labels.review.city}</p>
                  <p className="text-muted-foreground">
                    {cities.find((city) => city.id === cityId)?.label ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{labels.review.category}</p>
                  <p className="text-muted-foreground">
                    {categories.find((category) => category.id === categoryId)?.label ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{labels.review.source}</p>
                  <p className="text-muted-foreground">
                    {sourceUrl.trim() ? labels.review.sourcePresent : labels.review.sourceMissing}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{labels.review.warningsTitle}</p>
                <div className="flex flex-wrap gap-2">
                  {softWarnings.length > 0 ? (
                    softWarnings.map((warning) => (
                      <span
                        key={warning}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                      >
                        {warning}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      {labels.review.noWarnings}
                    </span>
                  )}
                </div>
                {duplicateHint ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {labels.review.duplicateHint}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? `${labels.submit}...` : labels.submit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PlaceSubmissionForm(props: PlaceSubmissionFormProps) {
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <PlaceSubmissionFormInner
      key={instanceKey}
      {...props}
      onReset={() => setInstanceKey((current) => current + 1)}
    />
  );
}
