/**
 * Query value for “alle Städte” auf /places und /events.
 * Reserviert — darf nicht als echter City-Slug verwendet werden.
 */
export const LISTING_ALL_CITIES_SLUG = "all" as const;

export function isListingCitySelected(city: string | undefined): boolean {
  return typeof city === "string" && city.length > 0;
}

export function isListingAllCities(city: string | undefined): boolean {
  return city === LISTING_ALL_CITIES_SLUG;
}

/** Nur echte Stadt-Slugs (nicht `all`, nicht leer). */
export function isSpecificListingCity(city: string | undefined): city is string {
  return typeof city === "string" && city.length > 0 && city !== LISTING_ALL_CITIES_SLUG;
}
