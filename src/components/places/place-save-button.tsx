"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { toggleSavePlace } from "@/server/actions/places/toggle-save-place";
import { Button } from "@/components/ui/button";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { guestAuthSignUpHrefFromSignIn } from "@/lib/auth/guest-auth-links";

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
  isSaved: isSavedProp,
  isAuthenticated,
  signInHref,
  labels,
}: PlaceSaveButtonProps) {
  const tGuest = useTranslations("guestConversion");
  const [isSaved, setIsSaved] = useState(isSavedProp);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setIsSaved(isSavedProp);
  }, [isSavedProp]);

  if (!isAuthenticated) {
    const signUpHref = guestAuthSignUpHrefFromSignIn(signInHref);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <GuestCtaInsightLink href={signInHref} locale={locale} surface="place_save" ctaType="signin">
            {labels.signIn}
          </GuestCtaInsightLink>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" asChild>
          <GuestCtaInsightLink href={signUpHref} locale={locale} surface="place_save" ctaType="signup">
            {tGuest("signUp")}
          </GuestCtaInsightLink>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) {
          return;
        }
        setPending(true);
        try {
          const formData = new FormData(e.currentTarget);
          const result = await toggleSavePlace(formData);
          if (result && result.ok) {
            setIsSaved(result.isSaved);
          }
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="placeId" value={placeId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <Button type="submit" variant={isSaved ? "outline" : "default"} size="sm" disabled={pending}>
        {pending ? labels.saving : isSaved ? labels.saved : labels.save}
      </Button>
    </form>
  );
}
