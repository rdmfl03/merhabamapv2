"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { resolveSocialGuardMessage } from "@/lib/social/social-guard-ui";

import {
  addPlaceToCollection,
  idlePlaceCollectionActionState,
  removePlaceFromCollection,
} from "@/server/actions/collections/place-collection-actions";
import type { PlaceCollectionMembershipRow } from "@/server/queries/collections/get-place-collection-membership-flags";

type PlaceCollectionTogglesProps = {
  placeId: string;
  locale: "de" | "tr";
  returnPath: string;
  rows: PlaceCollectionMembershipRow[];
  labels: {
    title: string;
    emptyHint: string;
    manageLink: string;
    privateBadge: string;
  };
};

export function PlaceCollectionToggles({
  placeId,
  locale,
  returnPath,
  rows,
  labels,
}: PlaceCollectionTogglesProps) {
  const router = useRouter();
  const tGuard = useTranslations("socialSafety");
  const tCols = useTranslations("collections");
  const [pending, startTransition] = useTransition();
  const [itemError, setItemError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/15 px-4 py-4">
      <p className="text-sm font-medium text-foreground">{labels.title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{labels.emptyHint}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2 text-sm">
              <input
                key={`${row.id}-${row.containsPlace}`}
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                defaultChecked={row.containsPlace}
                disabled={pending}
                onChange={(e) => {
                  const checked = e.target.checked;
                  startTransition(async () => {
                    setItemError(null);
                    const fd = new FormData();
                    fd.set("locale", locale);
                    fd.set("returnPath", returnPath);
                    fd.set("collectionId", row.id);
                    fd.set("placeId", placeId);
                    const res = checked
                      ? await addPlaceToCollection(idlePlaceCollectionActionState, fd)
                      : await removePlaceFromCollection(idlePlaceCollectionActionState, fd);
                    if (res.status === "error") {
                      const msg =
                        resolveSocialGuardMessage(res.message, (k) => tGuard(k)) ??
                        tCols("actionErrorFallback");
                      setItemError(msg);
                    }
                    router.refresh();
                  });
                }}
              />
              <span className="text-foreground">
                {row.title}
                {row.visibility === "PRIVATE" ? (
                  <span className="ml-1 text-xs text-muted-foreground">({labels.privateBadge})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs">
        <Link href="/collections" className="text-brand underline-offset-2 hover:underline">
          {labels.manageLink}
        </Link>
      </p>
      {itemError ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {itemError}
        </p>
      ) : null}
    </div>
  );
}
