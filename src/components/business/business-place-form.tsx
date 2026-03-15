"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessPlace } from "@/server/actions/business/update-business-place";
import {
  idleBusinessActionState,
  type BusinessActionState,
} from "@/server/actions/business/state";

type BusinessPlaceFormProps = {
  locale: "de" | "tr";
  place: {
    id: string;
    phone?: string | null;
    websiteUrl?: string | null;
    descriptionDe?: string | null;
    descriptionTr?: string | null;
    openingHoursJson?: string | null;
  };
  labels: {
    title: string;
    description: string;
    phone: string;
    website: string;
    descriptionDe: string;
    descriptionTr: string;
    openingHours: string;
    openingHoursHint: string;
    submit: string;
    success: string;
    error: string;
  };
};

export function BusinessPlaceForm({
  locale,
  place,
  labels,
}: BusinessPlaceFormProps) {
  const [state, formAction, pending] = useActionState<BusinessActionState, FormData>(
    updateBusinessPlace,
    idleBusinessActionState,
  );

  return (
    <Card className="bg-white/90">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">{labels.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{labels.description}</p>
        </div>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="placeId" value={place.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.phone}</span>
              <Input name="phone" defaultValue={place.phone ?? ""} maxLength={64} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.website}</span>
              <Input name="websiteUrl" defaultValue={place.websiteUrl ?? ""} maxLength={500} />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.descriptionDe}</span>
            <Textarea name="descriptionDe" defaultValue={place.descriptionDe ?? ""} />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.descriptionTr}</span>
            <Textarea name="descriptionTr" defaultValue={place.descriptionTr ?? ""} />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">{labels.openingHours}</span>
            <Textarea
              name="openingHoursJson"
              defaultValue={place.openingHoursJson ?? ""}
              placeholder='[{"day":"Mon-Sat","open":"09:00","close":"18:00"}]'
            />
            <p className="text-xs text-muted-foreground">{labels.openingHoursHint}</p>
          </label>

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
        </form>
      </CardContent>
    </Card>
  );
}
