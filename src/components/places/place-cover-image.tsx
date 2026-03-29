"use client";

import { useState } from "react";

type PlaceCoverImageProps = {
  src: string;
  alt: string;
  fallbackText: string;
  showFallbackBadge: boolean;
  fallbackBadgeLabel: string;
};

export function PlaceCoverImage({
  src,
  alt,
  fallbackText,
  showFallbackBadge,
  fallbackBadgeLabel,
}: PlaceCoverImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5f6f8] via-white to-[#eef1f5] text-sm font-medium text-brand">
        {fallbackText}
      </div>
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
      {showFallbackBadge ? (
        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm">
          {fallbackBadgeLabel}
        </div>
      ) : null}
    </>
  );
}
