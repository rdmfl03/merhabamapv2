"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { EventParticipationStatus } from "@prisma/client";

import { resolveSocialGuardMessage } from "@/lib/social/social-guard-ui";
import {
  idleEventParticipationActionState,
  toggleEventParticipation,
  type EventParticipationActionState,
} from "@/server/actions/events/toggle-event-participation-state";
import { Button } from "@/components/ui/button";
import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import { cn } from "@/lib/utils";

type EventParticipationPanelProps = {
  eventId: string;
  locale: "de" | "tr";
  returnPath: string;
  viewerStatus: EventParticipationStatus | null;
  isAuthenticated: boolean;
  signInHref: string;
  labels: {
    title: string;
    interested: string;
    going: string;
    signIn: string;
  };
};

export function EventParticipationPanel({
  eventId,
  locale,
  returnPath,
  viewerStatus,
  isAuthenticated,
  signInHref,
  labels,
}: EventParticipationPanelProps) {
  const router = useRouter();
  const tGuard = useTranslations("socialSafety");
  const tParticipation = useTranslations("events.detail.participation");
  const [state, formAction, pending] = useActionState(
    toggleEventParticipation,
    idleEventParticipationActionState as EventParticipationActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-4">
        <p className="text-sm font-medium text-foreground">{labels.title}</p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <GuestCtaInsightLink href={signInHref} locale={locale} surface="event_participation" ctaType="signin">
            {labels.signIn}
          </GuestCtaInsightLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/15 px-4 py-4">
      <p className="text-sm font-medium text-foreground">{labels.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={formAction} className="inline">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="intent" value="interested" />
          <Button
            type="submit"
            size="sm"
            variant={viewerStatus === "INTERESTED" ? "default" : "outline"}
            disabled={pending}
            className={cn(viewerStatus === "INTERESTED" && "ring-2 ring-brand/40")}
          >
            {labels.interested}
          </Button>
        </form>
        <form action={formAction} className="inline">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="intent" value="going" />
          <Button
            type="submit"
            size="sm"
            variant={viewerStatus === "GOING" ? "default" : "outline"}
            disabled={pending}
            className={cn(viewerStatus === "GOING" && "ring-2 ring-brand/40")}
          >
            {labels.going}
          </Button>
        </form>
      </div>
      {state.status === "error" ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {state.message === "validation_error"
            ? tParticipation("validationError")
            : state.message === "event_not_found"
              ? tParticipation("eventNotFound")
              : (resolveSocialGuardMessage(state.message, (k) => tGuard(k)) ?? state.message)}
        </p>
      ) : null}
    </div>
  );
}
