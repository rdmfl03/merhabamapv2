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

type PlaceCategoryLike = {
  slug: string;
  nameDe: string;
  nameTr: string;
};

const localizedPlaceCategoryLabels = {
  restaurants: { de: "Restaurants", tr: "Restoranlar" },
  cafes: { de: "Cafes", tr: "Kafeler" },
  bakeries: { de: "Bäckereien", tr: "Fırınlar" },
  markets: { de: "Supermärkte", tr: "Marketler" },
  mosques: { de: "Moscheen", tr: "Camiler" },
  barbers: { de: "Barbiere", tr: "Berberler" },
  "travel-agencies": { de: "Reisebüros", tr: "Seyahat acenteleri" },
  services: { de: "Dienstleistungen", tr: "Hizmetler" },
} satisfies Record<string, { de: string; tr: string }>;

const openingHoursDayLabels = {
  "Mon-Sun": { de: "Mo-So", tr: "Pzt-Paz" },
  "Tue-Sun": { de: "Di-So", tr: "Sal-Paz" },
  "Mon-Sat": { de: "Mo-Sa", tr: "Pzt-Cmt" },
  "Mon-Fri": { de: "Mo-Fr", tr: "Pzt-Cum" },
  Mon: { de: "Mo", tr: "Pzt" },
  Tue: { de: "Di", tr: "Sal" },
  Wed: { de: "Mi", tr: "Çar" },
  Thu: { de: "Do", tr: "Per" },
  Fri: { de: "Fr", tr: "Cum" },
  Sat: { de: "Sa", tr: "Cmt" },
  Sun: { de: "So", tr: "Paz" },
} satisfies Record<string, { de: string; tr: string }>;

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

export function formatOpeningHoursDay(
  day: string,
  locale: Locale | "de" | "tr",
) {
  const label = openingHoursDayLabels[day as keyof typeof openingHoursDayLabels];
  if (!label) {
    return day;
  }

  return locale === "tr" ? label.tr : label.de;
}

export function getLocalizedPlaceCategoryLabel(
  category: PlaceCategoryLike,
  locale: Locale | "de" | "tr",
) {
  const label =
    localizedPlaceCategoryLabels[
      category.slug as keyof typeof localizedPlaceCategoryLabels
    ];

  if (label) {
    return locale === "tr" ? label.tr : label.de;
  }

  return locale === "tr" ? category.nameTr : category.nameDe;
}

export function getPlaceImage(images: string[] | null | undefined) {
  return images?.[0] ?? null;
}

export function buildPlacesPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; q?: string; sort?: string },
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
  if (filters?.sort) {
    search.set("sort", filters.sort);
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
