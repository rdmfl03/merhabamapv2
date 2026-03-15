"use client";

import { useFormStatus } from "react-dom";

import { toggleSavePlace } from "@/server/actions/places/toggle-save-place";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

function SaveSubmitButton({
  isSaved,
  labels,
}: {
  isSaved: boolean;
  labels: {
    save: string;
    saved: string;
    saving: string;
  };
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={isSaved ? "outline" : "default"} size="sm">
      {pending ? labels.saving : isSaved ? labels.saved : labels.save}
    </Button>
  );
}

type PlaceSaveButtonProps = {
  placeId: string;
  locale: "de" | "tr";
  returnPath: string;
  isSaved: boolean;
  isAuthenticated: boolean;
  signInHref: string;
  labels: {
    save: string;
    saved: string;
    saving: string;
    signIn: string;
  };
};

export function PlaceSaveButton({
  placeId,
  locale,
  returnPath,
  isSaved,
  isAuthenticated,
  signInHref,
  labels,
}: PlaceSaveButtonProps) {
  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={signInHref}>{labels.signIn}</Link>
      </Button>
    );
  }

  return (
    <form action={toggleSavePlace}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="placeId" value={placeId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <SaveSubmitButton isSaved={isSaved} labels={labels} />
    </form>
  );
}
