import { isSpecificListingCity } from "@/lib/listing-city-filter";

function searchQueryString(args: { q?: string; city?: string | null }): string {
  const p = new URLSearchParams();
  const q = args.q?.trim() ?? "";
  if (q.length > 0) {
    p.set("q", q);
  }
  if (isSpecificListingCity(args.city ?? undefined)) {
    p.set("city", args.city!);
  }
  return p.toString();
}

/** Path including locale prefix (returnPath, forms). */
export function buildPublicSearchPath(
  locale: string,
  args: { q?: string; city?: string | null },
): string {
  const qs = searchQueryString(args);
  return `/${locale}/search${qs ? `?${qs}` : ""}`;
}

/** Path for metadata / Open Graph (locale added by site helper). */
export function publicSearchMetadataPath(args: { q?: string; city?: string | null }): string {
  const qs = searchQueryString(args);
  return `/search${qs ? `?${qs}` : ""}`;
}
