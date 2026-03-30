"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { PlaceCard } from "@/components/places/place-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import {
  getSavedPlaceCount,
  getSavedPlaceIds,
  subscribeToSavedPlaces,
} from "@/lib/saved-places";
import {
  getLocalizedPlaceCategoryLabel,
  getLocalizedText,
} from "@/lib/places";
import type { ListedPlace } from "@/server/queries/places/list-places";
import type { PlaceImageAttributionLabels } from "@/components/places/place-image-attribution";

type PlacesSavedFilterShellProps = {
  locale: "de" | "tr";
  places: ListedPlace[];
  currentPath: string;
  children: ReactNode;
  imageAttributionLabels?: PlaceImageAttributionLabels;
  labels: {
    toggle: string;
    activeHint: string;
    panelTitle: string;
    results: string;
    emptyTitle: string;
    emptyDescription: string;
    showAll: string;
    details: string;
    save: string;
    saved: string;
    saving: string;
    signIn: string;
    verified: string;
    fallbackDescription: string;
  };
};

export function PlacesSavedFilterShell({
  locale,
  places,
  currentPath,
  children,
  imageAttributionLabels,
  labels,
}: PlacesSavedFilterShellProps) {
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [savedPlaceCount, setSavedPlaceCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      setSavedPlaceIds(getSavedPlaceIds());
      setSavedPlaceCount(getSavedPlaceCount());
    };

    sync();
    return subscribeToSavedPlaces(sync);
  }, []);

  const savedPlaces = useMemo(() => {
    const savedIds = new Set(savedPlaceIds);
    return places.filter((place) => savedIds.has(place.id));
  }, [places, savedPlaceIds]);

  const miniSavedPlaces = useMemo(() => savedPlaces.slice(0, 3), [savedPlaces]);
  const toggleLabel =
    savedPlaceCount > 0 ? `${labels.toggle} (${savedPlaceCount})` : labels.toggle;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-2 rounded-[1.3rem] border border-border bg-white/90 px-4 py-3 text-sm">
        <Button
          type="button"
          variant={savedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setSavedOnly((value) => !value)}
        >
          {toggleLabel}
        </Button>
        {savedOnly ? (
          <span className="text-muted-foreground">{labels.activeHint}</span>
        ) : null}
      </section>

      {savedOnly ? (
        savedPlaces.length === 0 ? (
          <Card className="bg-white/90">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="space-y-2">
                <h2 className="font-display text-2xl text-foreground">
                  {labels.emptyTitle}
                </h2>
                <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
                  {labels.emptyDescription}
                </p>
              </div>
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => setSavedOnly(false)}>
                  {labels.showAll}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {labels.results.replace("{count}", String(savedPlaces.length))}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedPlaces.map((place) => (
                <PlaceCard
                  key={`saved-only-${place.id}`}
                  place={place}
                  locale={locale}
                  description={getLocalizedText(
                    { de: place.descriptionDe, tr: place.descriptionTr },
                    locale,
                    labels.fallbackDescription,
                  )}
                  categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                  cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                  returnPath={currentPath}
                  isAuthenticated={false}
                  labels={{
                    details: labels.details,
                    save: labels.save,
                    saved: labels.saved,
                    saving: labels.saving,
                    signIn: labels.signIn,
                    verified: labels.verified,
                  }}
                  imageAttributionLabels={imageAttributionLabels}
                />
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          {miniSavedPlaces.length > 0 ? (
            <section className="space-y-4 py-1">
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-foreground">{labels.panelTitle}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {miniSavedPlaces.map((place) => (
                  <PlaceCard
                    key={`mini-saved-${place.id}`}
                    place={place}
                    locale={locale}
                    description={getLocalizedText(
                      { de: place.descriptionDe, tr: place.descriptionTr },
                      locale,
                      labels.fallbackDescription,
                    )}
                    categoryLabel={getLocalizedPlaceCategoryLabel(place.category, locale)}
                    cityLabel={getLocalizedCityDisplayName(locale, place.city)}
                    returnPath={currentPath}
                    isAuthenticated={false}
                    labels={{
                      details: labels.details,
                      save: labels.save,
                      saved: labels.saved,
                      saving: labels.saving,
                      signIn: labels.signIn,
                      verified: labels.verified,
                    }}
                    imageAttributionLabels={imageAttributionLabels}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {children}
        </>
      )}
    </div>
  );
}
