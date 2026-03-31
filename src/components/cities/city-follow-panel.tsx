"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { resolveSocialGuardMessage } from "@/lib/social/social-guard-ui";
import { toggleCityFollow } from "@/server/actions/cities/toggle-city-follow";
import {
  idleCityFollowActionState,
  type CityFollowActionState,
} from "@/server/actions/cities/city-follow-action-state";
import { Button } from "@/components/ui/button";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { guestAuthSignUpHrefFromSignIn } from "@/lib/auth/guest-auth-links";

type CityFollowPanelProps = {
  cityId: string;
  locale: "de" | "tr";
  returnPath: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
  signInHref: string;
  labels: {
    follow: string;
    unfollow: string;
    signIn: string;
    signUp: string;
    signInHint: string;
  };
};

export function CityFollowPanel({
  cityId,
  locale,
  returnPath,
  isFollowing,
  isAuthenticated,
  signInHref,
  labels,
}: CityFollowPanelProps) {
  const router = useRouter();
  const tGuard = useTranslations("socialSafety");
  const tCityFollow = useTranslations("cities.cityFollow");
  const [state, formAction, pending] = useActionState(
    toggleCityFollow,
    idleCityFollowActionState as CityFollowActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (!isAuthenticated) {
    const signUpHref = guestAuthSignUpHrefFromSignIn(signInHref);
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
        <p className="text-xs text-muted-foreground">{labels.signInHint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <GuestCtaInsightLink href={signInHref} locale={locale} surface="city_follow" ctaType="signin">
              {labels.signIn}
            </GuestCtaInsightLink>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
            <GuestCtaInsightLink href={signUpHref} locale={locale} surface="city_follow" ctaType="signup">
              {labels.signUp}
            </GuestCtaInsightLink>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <input type="hidden" name="cityId" value={cityId} />
      <Button type="submit" size="sm" variant={isFollowing ? "outline" : "default"} disabled={pending}>
        {isFollowing ? labels.unfollow : labels.follow}
      </Button>
      {state.status === "error" ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {state.message === "validation_error"
            ? tCityFollow("validationError")
            : (resolveSocialGuardMessage(state.message, (k) => tGuard(k)) ?? state.message)}
        </p>
      ) : null}
    </form>
  );
}
