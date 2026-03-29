export type CityDisplayFields = {
  slug: string;
  nameDe: string;
  nameTr: string;
};

/**
 * Slugs/legacy DB may use ASCII "koeln"; German UI should show "Köln".
 */
export function getLocalizedCityDisplayName(
  locale: "de" | "tr",
  city: CityDisplayFields,
): string {
  if (locale === "de" && (city.slug === "koeln" || city.nameDe.trim().toLowerCase() === "koeln")) {
    return "Köln";
  }
  return locale === "tr" ? city.nameTr : city.nameDe;
}
