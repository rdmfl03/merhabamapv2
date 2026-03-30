"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { guestAuthSignUpHrefFromSignIn } from "@/lib/auth/guest-auth-links";
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
  const tGuest = useTranslations("guestConversion");

  if (!isAuthenticated) {
    const signUpHref = guestAuthSignUpHrefFromSignIn(signInHref);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <GuestCtaInsightLink href={signInHref} locale={locale} surface="event_save" ctaType="signin">
            {labels.signIn}
          </GuestCtaInsightLink>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" asChild>
          <GuestCtaInsightLink href={signUpHref} locale={locale} surface="event_save" ctaType="signup">
            {tGuest("signUp")}
          </GuestCtaInsightLink>
        </Button>
      </div>
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
