"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookOpen,
  Briefcase,
  CalendarDays,
  Coffee,
  Croissant,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Landmark,
  MapPin,
  MessagesSquare,
  Moon,
  Music,
  Plane,
  Scissors,
  ShoppingBasket,
  Theater,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import {
  CATEGORY_FALLBACK_GRADIENT,
  type CategoryFallbackVisualKey,
} from "@/lib/category-fallback-visual";

const FALLBACK_ICONS: Record<CategoryFallbackVisualKey, LucideIcon> = {
  default: MapPin,
  dining: UtensilsCrossed,
  cafe: Coffee,
  bakery: Croissant,
  retail: ShoppingBasket,
  spiritual: Landmark,
  grooming: Scissors,
  travel: Plane,
  services: Briefcase,
  culture: Theater,
  community: Users,
  active: Dumbbell,
  venue: CalendarDays,
  nightlife: Moon,
  learning: BookOpen,
  wellness: HeartPulse,
  advice: MessagesSquare,
  family: Baby,
  concert: Music,
  student: GraduationCap,
  business_event: Briefcase,
};

type CategoryFallbackCoverProps = {
  visualKey: CategoryFallbackVisualKey;
  variant: "card" | "hero";
  eyebrow?: string;
  title: string;
  /** e.g. short line under title on cards */
  subtitle?: string;
  className?: string;
  /** Extra nodes above content (badges) */
  headerSlot?: ReactNode;
};

export function CategoryFallbackCover({
  visualKey,
  variant,
  eyebrow,
  title,
  subtitle,
  className = "",
  headerSlot,
}: CategoryFallbackCoverProps) {
  const patternId = useId().replace(/:/g, "");
  const gradient = CATEGORY_FALLBACK_GRADIENT[visualKey] ?? CATEGORY_FALLBACK_GRADIENT.default;
  const Icon = FALLBACK_ICONS[visualKey] ?? FALLBACK_ICONS.default;
  const iconSize = variant === "hero" ? "h-32 w-32 sm:h-40 sm:w-40" : "h-24 w-24";
  const titleClass =
    variant === "hero"
      ? "font-display text-3xl text-foreground sm:text-4xl md:text-5xl"
      : "line-clamp-2 text-sm font-semibold leading-snug text-foreground";

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${className}`}
      style={{ background: gradient }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-[hsl(357_91%_46%)]"
        aria-hidden
      >
        <defs>
          <pattern
            id={patternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.06"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      <Icon
        className={`pointer-events-none absolute -bottom-2 -right-2 ${iconSize} text-[hsl(357_91%_46%)] opacity-[0.09]`}
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative z-[1] flex max-h-full w-full flex-col items-center justify-center gap-2 px-4 py-3 text-center">
        {headerSlot}
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand/80">
            {eyebrow}
          </p>
        ) : null}
        {variant === "hero" ? (
          <h1 className={titleClass}>{title}</h1>
        ) : (
          <p className={titleClass}>{title}</p>
        )}
        {subtitle ? (
          <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
