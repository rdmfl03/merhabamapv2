"use client";

import { useActionState } from "react";

import { submitPlaceClaim } from "@/server/actions/places/submit-place-claim";
import { idlePlaceActionState } from "@/server/actions/places/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

type PlaceClaimFormProps = {
  placeId: string;
  locale: "de" | "tr";
  returnPath: string;
  isAuthenticated: boolean;
  signInHref: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
  labels: {
    title: string;
    description: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    evidenceLabel: string;
    evidencePlaceholder: string;
    submit: string;
    signIn: string;
    success: string;
    error: string;
  };
};

export function PlaceClaimForm({
  placeId,
  locale,
  returnPath,
  isAuthenticated,
  signInHref,
  defaultName,
  defaultEmail,
  labels,
}: PlaceClaimFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPlaceClaim,
    idlePlaceActionState,
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{labels.title}</h3>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>

        {!isAuthenticated ? (
          <Button variant="outline" asChild>
            <Link href={signInHref}>{labels.signIn}</Link>
          </Button>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="placeId" value={placeId} />
            <input type="hidden" name="returnPath" value={returnPath} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-foreground">{labels.nameLabel}</span>
                <Input
                  name="claimantName"
                  defaultValue={defaultName ?? ""}
                  required
                  maxLength={120}
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-foreground">{labels.emailLabel}</span>
                <Input
                  name="claimantEmail"
                  type="email"
                  defaultValue={defaultEmail ?? ""}
                  required
                  maxLength={180}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.phoneLabel}</span>
              <Input name="claimantPhone" maxLength={40} />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.messageLabel}</span>
              <Textarea
                name="message"
                placeholder={labels.messagePlaceholder}
                maxLength={1200}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-foreground">{labels.evidenceLabel}</span>
              <Textarea
                name="evidenceNotes"
                placeholder={labels.evidencePlaceholder}
                maxLength={1000}
              />
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
        )}
      </CardContent>
    </Card>
  );
}
