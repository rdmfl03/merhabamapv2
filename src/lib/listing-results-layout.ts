export type ListingResultsLayout = "grid" | "list";

/**
 * Listing pages default to list view; `?layout=grid` selects the card grid.
 */
export function parseListingResultsLayout(
  raw: Record<string, string | string[] | undefined>,
): ListingResultsLayout {
  const v = Array.isArray(raw.layout) ? raw.layout[0] : raw.layout;
  return v === "grid" ? "grid" : "list";
}
