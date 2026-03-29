"use client";

import { useState } from "react";

import {
  PlaceImageAttribution,
  type PlaceImageAttributionLabels,
} from "@/components/places/place-image-attribution";
import type { ResolvedEntityImage } from "@/lib/media";

type PlaceDetailHeroProps = {
  image: ResolvedEntityImage | null;
  placeName: string;
  categoryLabel: string;
  locale: "de" | "tr";
  attributionLabels: PlaceImageAttributionLabels;
};

export function PlaceDetailHero({
  image,
  placeName,
  categoryLabel,
  locale,
  attributionLabels,
}: PlaceDetailHeroProps) {
  const [broken, setBroken] = useState(false);
  const showAsImage = Boolean(image && !broken);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
      <div className="relative flex h-72 items-center justify-center overflow-hidden bg-gradient-to-br from-[#f5f6f8] via-white to-[#eef1f5] sm:h-96">
        {showAsImage && image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.altText ?? placeName}
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
            />
            {image.isFallback ? (
              <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
                {locale === "tr" ? "Fallback gorsel" : "Fallback-Bild"}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              {categoryLabel}
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              {placeName}
            </h1>
          </div>
        )}
      </div>
      {showAsImage && image ? (
        <div className="space-y-2 border-t border-border/70 bg-white/90 px-5 py-3">
          {image.isFallback ? (
            <p className="text-xs font-medium text-muted-foreground">
              {locale === "tr"
                ? "Bu gorsel acikca fallback olarak isaretlenmistir ve mekanin gercek fotografi olmayabilir."
                : "Dieses Bild ist klar als Fallback markiert und zeigt moeglicherweise nicht den realen Ort."}
            </p>
          ) : null}
          <PlaceImageAttribution
            model={image}
            variant="detail"
            labels={attributionLabels}
          />
        </div>
      ) : null}
    </div>
  );
}
