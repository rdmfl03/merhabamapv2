"use client";

import { useState } from "react";

import { CategoryFallbackCover } from "@/components/media/category-fallback-cover";
import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";

type EventCoverImageProps = {
  src: string;
  alt: string;
  title: string;
  eyebrow?: string;
  visualKey: CategoryFallbackVisualKey;
  showDbFallbackBadge: boolean;
  fallbackBadgeLabel: string;
};

export function EventCoverImage({
  src,
  alt,
  title,
  eyebrow,
  visualKey,
  showDbFallbackBadge,
  fallbackBadgeLabel,
}: EventCoverImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <>
        <CategoryFallbackCover
          visualKey={visualKey}
          variant="card"
          eyebrow={eyebrow}
          title={title}
        />
        {showDbFallbackBadge ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
            {fallbackBadgeLabel}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
      {showDbFallbackBadge ? (
        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
          {fallbackBadgeLabel}
        </div>
      ) : null}
    </>
  );
}
