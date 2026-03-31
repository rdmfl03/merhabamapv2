import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";

export type MapViewportBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type CityMapPoint = {
  id: string;
  kind: "place" | "event";
  label: string;
  href: string;
  imageUrl?: string | null;
  fallbackVisualKey?: CategoryFallbackVisualKey;
  description: string;
  latitude: number;
  longitude: number;
  categoryLabel: string;
  meta: string;
  /** Nur Orte: volle Adresszeile (Popup/Liste statt nur Stadt). */
  mapAddressLine?: string | null;
  /** Nur Orte: z. B. „4,2 / 5“, ohne Zusatztexte. */
  mapRatingLabel?: string | null;
};
