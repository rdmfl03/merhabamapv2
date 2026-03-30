"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  idleCityFollowActionState,
  toggleCityFollow,
  type CityFollowActionState,
} from "@/server/actions/cities/toggle-city-follow";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

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
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
        <p className="text-xs text-muted-foreground">{labels.signInHint}</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href={signInHref}>{labels.signIn}</Link>
        </Button>
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
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
