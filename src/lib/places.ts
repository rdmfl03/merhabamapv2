import type { Locale } from "@prisma/client";

type LocalizedText = {
  de?: string | null;
  tr?: string | null;
};

type OpeningHoursEntry = {
  day: string;
  open: string;
  close: string;
};

export function getLocalizedText(
  value: LocalizedText,
  locale: Locale | "de" | "tr",
  fallback = "",
) {
  if (locale === "tr") {
    return value.tr ?? value.de ?? fallback;
  }

  return value.de ?? value.tr ?? fallback;
}

export function parseOpeningHours(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as OpeningHoursEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        typeof entry?.day === "string" &&
        typeof entry?.open === "string" &&
        typeof entry?.close === "string",
    );
  } catch {
    return [];
  }
}

export function getPlaceImage(images: string[] | null | undefined) {
  return images?.[0] ?? null;
}

export function buildPlacesPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; q?: string },
) {
  const search = new URLSearchParams();

  if (filters?.city) {
    search.set("city", filters.city);
  }
  if (filters?.category) {
    search.set("category", filters.category);
  }
  if (filters?.q) {
    search.set("q", filters.q);
  }

  const query = search.toString();

  return query ? `/${locale}/places?${query}` : `/${locale}/places`;
}

export function getVerificationTone(status: string) {
  if (status === "VERIFIED") {
    return "verified";
  }

  if (status === "CLAIMED") {
    return "claimed";
  }

  return "default";
}
