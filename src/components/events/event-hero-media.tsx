"use client";

import { useState } from "react";

import { CategoryFallbackCover } from "@/components/media/category-fallback-cover";
import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import type { ResolvedEntityImage } from "@/lib/media";

type EventHeroMediaProps = {
  image: ResolvedEntityImage | null;
  title: string;
  categoryLabel: string;
  visualKey: CategoryFallbackVisualKey;
  locale: "de" | "tr";
};

export function EventHeroMedia({
  image,
  title,
  categoryLabel,
  visualKey,
  locale,
}: EventHeroMediaProps) {
  const [broken, setBroken] = useState(false);
  const showAsImage = Boolean(image && !broken);

  return (
    <div className="relative flex h-72 items-center justify-center overflow-hidden sm:h-96">
      {showAsImage && image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.altText ?? title}
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
          visualKey={visualKey}
          variant="hero"
          eyebrow={categoryLabel}
          title={title}
        />
      )}
    </div>
  );
}
