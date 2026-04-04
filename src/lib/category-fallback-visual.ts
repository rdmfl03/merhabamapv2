import type { EventCategory } from "@prisma/client";

/** Internal theme id for gradients + icon (places + events). */
export type CategoryFallbackVisualKey =
  | "default"
  | "dining"
  | "cafe"
  | "bakery"
  | "retail"
  | "spiritual"
  | "grooming"
  | "travel"
  | "services"
  | "culture"
  | "community"
  | "active"
  | "venue"
  | "nightlife"
  | "learning"
  | "wellness"
  | "advice"
  | "family"
  | "concert"
  | "student"
  | "business_event";

type PlaceCategoryLike = {
  category?: {
    slug?: string | null;
  } | null;
};

/** Maps `place_category.slug` → shared visual / onboarding group key (places only). */
export const PLACE_SLUG_TO_VISUAL_KEY: Readonly<
  Record<string, CategoryFallbackVisualKey>
> = {
  restaurants: "dining",
  gastronomy: "dining",
  catering: "dining",
  cafes: "cafe",
  "cafes-teahouses": "cafe",
  bakeries: "bakery",
  markets: "retail",
  retail: "retail",
  mosques: "spiritual",
  "religious-sites": "spiritual",
  barbers: "grooming",
  "travel-agencies": "travel",
  services: "services",
  "cultural-centers": "culture",
  associations: "community",
  "sports-leisure": "active",
  "event-venues": "venue",
  nightlife: "nightlife",
  "education-language": "learning",
  health: "wellness",
  advisory: "advice",
  childcare: "family",
} as const;

export function getPlaceImageFallbackKey(place: PlaceCategoryLike): CategoryFallbackVisualKey {
  const slug = place.category?.slug?.trim().toLowerCase() ?? "";
  return PLACE_SLUG_TO_VISUAL_KEY[slug] ?? "default";
}

export function getEventImageFallbackKey(category: EventCategory): CategoryFallbackVisualKey {
  switch (category) {
    case "CONCERT":
      return "concert";
    case "CULTURE":
      return "culture";
    case "STUDENT":
      return "student";
    case "COMMUNITY":
      return "community";
    case "FAMILY":
      return "family";
    case "BUSINESS":
      return "business_event";
    case "RELIGIOUS":
      return "spiritual";
    default:
      return "default";
  }
}

/** Soft gradients: neutrals + whisper of brand red (357°) or a muted category hue. */
export const CATEGORY_FALLBACK_GRADIENT: Record<CategoryFallbackVisualKey, string> = {
  default:
    "linear-gradient(148deg, #f1f2f6 0%, #ffffff 48%, rgba(227, 10, 23, 0.07) 100%)",
  dining:
    "linear-gradient(148deg, #f5f2ee 0%, #fffdfb 45%, rgba(227, 10, 23, 0.09) 100%)",
  cafe:
    "linear-gradient(148deg, #f4f2f0 0%, #ffffff 50%, rgba(180, 120, 90, 0.08) 100%)",
  bakery:
    "linear-gradient(148deg, #f6f3ec 0%, #fffaf6 48%, rgba(227, 10, 23, 0.06) 100%)",
  retail:
    "linear-gradient(148deg, #eef2f4 0%, #ffffff 50%, rgba(15, 118, 110, 0.06) 100%)",
  spiritual:
    "linear-gradient(148deg, #eef0f6 0%, #fafbff 52%, rgba(99, 102, 241, 0.07) 100%)",
  grooming:
    "linear-gradient(148deg, #f0f1f4 0%, #ffffff 50%, rgba(71, 85, 105, 0.07) 100%)",
  travel:
    "linear-gradient(148deg, #edf3f8 0%, #ffffff 48%, rgba(14, 116, 144, 0.07) 100%)",
  services:
    "linear-gradient(148deg, #f0f2f5 0%, #ffffff 50%, rgba(227, 10, 23, 0.05) 100%)",
  culture:
    "linear-gradient(148deg, #f1eef5 0%, #fdfcfe 50%, rgba(124, 58, 237, 0.06) 100%)",
  community:
    "linear-gradient(148deg, #f0f3f6 0%, #ffffff 50%, rgba(227, 10, 23, 0.06) 100%)",
  active:
    "linear-gradient(148deg, #edf4f1 0%, #ffffff 50%, rgba(22, 163, 74, 0.06) 100%)",
  venue:
    "linear-gradient(148deg, #f1f2f6 0%, #ffffff 48%, rgba(227, 10, 23, 0.08) 100%)",
  nightlife:
    "linear-gradient(148deg, #eceef3 0%, #f8f7fa 45%, rgba(127, 29, 29, 0.08) 100%)",
  learning:
    "linear-gradient(148deg, #eef2f8 0%, #ffffff 50%, rgba(37, 99, 235, 0.06) 100%)",
  wellness:
    "linear-gradient(148deg, #edf5f4 0%, #ffffff 52%, rgba(13, 148, 136, 0.07) 100%)",
  advice:
    "linear-gradient(148deg, #f1f2f6 0%, #ffffff 50%, rgba(227, 10, 23, 0.05) 100%)",
  family:
    "linear-gradient(148deg, #f4f2f5 0%, #ffffff 50%, rgba(219, 39, 119, 0.06) 100%)",
  concert:
    "linear-gradient(148deg, #f0edf6 0%, #fdfcfe 48%, rgba(147, 51, 234, 0.08) 100%)",
  student:
    "linear-gradient(148deg, #eef2f7 0%, #ffffff 50%, rgba(29, 78, 216, 0.07) 100%)",
  business_event:
    "linear-gradient(148deg, #f0f1f4 0%, #ffffff 50%, rgba(30, 41, 59, 0.08) 100%)",
};
