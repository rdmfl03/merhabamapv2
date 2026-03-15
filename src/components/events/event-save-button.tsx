"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { toggleSaveEvent } from "@/server/actions/events/toggle-save-event";

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

type EventSaveButtonProps = {
  eventId: string;
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

export function EventSaveButton({
  eventId,
  locale,
  returnPath,
  isSaved,
  isAuthenticated,
  signInHref,
  labels,
}: EventSaveButtonProps) {
  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={signInHref}>{labels.signIn}</Link>
      </Button>
    );
  }

  return (
    <form action={toggleSaveEvent}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <SaveSubmitButton isSaved={isSaved} labels={labels} />
    </form>
  );
}
