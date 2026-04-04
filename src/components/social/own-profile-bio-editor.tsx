"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileBio } from "@/server/actions/user/update-profile-bio";
import { idleUserFormState } from "@/server/actions/user/state";
import type { AppLocale } from "@/i18n/routing";

type OwnProfileBioEditorProps = {
  locale: AppLocale;
  initialBio: string | null | undefined;
  labels: {
    sectionLabel: string;
    emptyHint: string;
    edit: string;
    save: string;
    cancel: string;
    success: string;
    error: string;
  };
};

export function OwnProfileBioEditor({ locale, initialBio, labels }: OwnProfileBioEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialBio ?? "");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileBio, idleUserFormState);

  useEffect(() => {
    setDraft(initialBio ?? "");
  }, [initialBio]);

  useEffect(() => {
    if (state.status === "success") {
      setEditing(false);
      router.refresh();
    }
  }, [state.status, router]);

  const bioText = initialBio?.trim() ? initialBio : null;

  if (editing) {
    return (
      <form action={formAction} className="max-w-xl space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{labels.sectionLabel}</span>
          <Textarea
            name="bio"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            rows={4}
            disabled={pending}
          />
        </label>
        {state.status === "error" ? (
          <p className="text-sm text-brand" role="alert">
            {labels.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {labels.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setDraft(initialBio ?? "");
              setEditing(false);
            }}
          >
            {labels.cancel}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-xl space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{labels.sectionLabel}</span>
        <Button type="button" variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => setEditing(true)}>
          {labels.edit}
        </Button>
      </div>
      {state.status === "success" ? (
        <p className="text-sm text-green-700" role="status">
          {labels.success}
        </p>
      ) : null}
      {bioText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{bioText}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
      )}
    </div>
  );
}
