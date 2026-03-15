"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/server/actions/user/update-profile";
import { idleUserFormState } from "@/server/actions/user/state";
import type { UserInterest } from "@/lib/user-preferences";

type ProfileFormProps = {
  locale: "de" | "tr";
  profile: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
    preferredLocale?: "de" | "tr" | null;
    cityId?: string | null;
    interests: UserInterest[];
  };
  cities: Array<{ id: string; label: string }>;
  interests: Array<{ value: UserInterest; label: string }>;
  labels: {
    name: string;
    username: string;
    email: string;
    language: string;
    city: string;
    interests: string;
    submit: string;
    success: string;
    errors: {
      default: string;
      validation: string;
      usernameTaken: string;
    };
  };
};

export function ProfileForm({
  locale,
  profile,
  cities,
  interests,
  labels,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    idleUserFormState,
  );
  const errorMessage =
    state.message === "username_taken"
      ? labels.errors.usernameTaken
      : state.message === "validation_error"
        ? labels.errors.validation
        : labels.errors.default;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <Card className="bg-white/90">
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.name}</span>
              <Input name="name" defaultValue={profile.name ?? ""} maxLength={120} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.username}</span>
              <Input
                name="username"
                defaultValue={profile.username ?? ""}
                maxLength={32}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.email}</span>
            <Input value={profile.email ?? ""} readOnly disabled />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.language}</span>
              <select
                name="preferredLocale"
                defaultValue={profile.preferredLocale ?? locale}
                className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="de">Deutsch</option>
                <option value="tr">Türkçe</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.city}</span>
              <select
                name="cityId"
                defaultValue={profile.cityId ?? cities[0]?.id}
                className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{labels.interests}</p>
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
                    defaultChecked={profile.interests.includes(interest.value)}
                  />
                  <span className="text-sm font-medium text-foreground">{interest.label}</span>
                </label>
              ))}
            </div>
          </div>

          {state.status === "success" ? (
            <p className="text-sm text-green-700">{labels.success}</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-brand">{errorMessage}</p>
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
