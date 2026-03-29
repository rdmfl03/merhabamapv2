"use client";

import { useState } from "react";

import { CategoryFallbackCover } from "@/components/media/category-fallback-cover";
import {
  PlaceImageAttribution,
  type PlaceImageAttributionLabels,
} from "@/components/places/place-image-attribution";
import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import type { ResolvedEntityImage } from "@/lib/media";

type PlaceDetailHeroProps = {
  image: ResolvedEntityImage | null;
  placeName: string;
  categoryLabel: string;
  fallbackVisualKey: CategoryFallbackVisualKey;
  locale: "de" | "tr";
  attributionLabels: PlaceImageAttributionLabels;
};

export function PlaceDetailHero({
  image,
  placeName,
  categoryLabel,
  fallbackVisualKey,
  locale,
  attributionLabels,
}: PlaceDetailHeroProps) {
  const [broken, setBroken] = useState(false);
  const showAsImage = Boolean(image && !broken);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
      <div className="relative flex h-72 items-center justify-center overflow-hidden sm:h-96">
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
          <CategoryFallbackCover
            visualKey={fallbackVisualKey}
            variant="hero"
            eyebrow={categoryLabel}
            title={placeName}
          />
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
