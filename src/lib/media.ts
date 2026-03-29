type MediaAssetLike = {
  id?: string | null;
  assetUrl: string;
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  externalRef?: string | null;
  role: string;
  status: string;
  rightsStatus: string;
  attributionText?: string | null;
  attributionUrl?: string | null;
  altText?: string | null;
  sortOrder?: number | null;
  observedAt?: Date | null;
};

export type ResolvedEntityImage = {
  url: string;
  altText: string | null;
  isFallback: boolean;
  sourceKind: "primary_asset" | "fallback_asset" | "legacy";
  sourceProvider: string | null;
  attributionText: string | null;
  attributionUrl: string | null;
  assetId: string | null;
  /** Original source page from `MediaAsset.source_url` when URL is display-safe. */
  sourceUrl: string | null;
  /**
   * Optional licence string (e.g. "CC BY-SA 4.0"). Not stored on `MediaAsset` today —
   * reserved for a future column or API field (`imageLicense`).
   */
  imageLicense?: string | null;
  /**
   * Canonical detail URL for "Quelle", if distinct from `sourceUrl` / `attributionUrl`.
   * Not populated until backend exposes it (`imageDetailUrl`).
   */
  imageDetailUrl?: string | null;
  /** Mirrors `attributionText` when set from an asset; alias for future API shape. */
  imageAttributionText?: string | null;
  /** Display label for origin (often `MediaAsset.source_provider`). */
  imageSource?: string | null;
  /** When true, UI may highlight that attribution obligations apply (future API). */
  imageAttributionRequired?: boolean | null;
};

function canDisplayPrimaryOrGalleryAsset(asset: MediaAssetLike | null | undefined) {
  return Boolean(
    asset &&
      asset.status === "ACTIVE" &&
      asset.role !== "FALLBACK" &&
      asset.rightsStatus === "DISPLAY_ALLOWED",
  );
}

function canDisplayFallbackAsset(asset: MediaAssetLike | null | undefined) {
  return Boolean(
    asset &&
      asset.status === "ACTIVE" &&
      asset.role === "FALLBACK" &&
      (asset.rightsStatus === "DISPLAY_ALLOWED" ||
        asset.rightsStatus === "INTERNAL_FALLBACK_ONLY"),
  );
}

function normalizeLegacyImage(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/** Reject empty, non-http(s) schemes, and obvious XSS vectors in stored URLs. */
export function isDisplayableMediaUrl(url: string | null | undefined): boolean {
  if (url == null) {
    return false;
  }
  const t = url.trim();
  if (!t) {
    return false;
  }
  const lower = t.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return false;
  }
  if (t.startsWith("/")) {
    return true;
  }
  if (t.startsWith("//")) {
    return true;
  }
  return /^https?:\/\//i.test(t);
}

function normalizeDisplayableUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed && isDisplayableMediaUrl(trimmed) ? trimmed : null;
}

function toResolvedImage(
  asset: MediaAssetLike,
  sourceKind: "primary_asset" | "fallback_asset",
): ResolvedEntityImage {
  return {
    url: asset.assetUrl,
    altText: asset.altText ?? null,
    isFallback: sourceKind === "fallback_asset",
    sourceKind,
    sourceProvider: asset.sourceProvider ?? null,
    attributionText: asset.attributionText ?? null,
    attributionUrl: normalizeDisplayableUrl(asset.attributionUrl),
    assetId: asset.id ?? null,
    sourceUrl: normalizeDisplayableUrl(asset.sourceUrl),
    imageLicense: null,
    imageDetailUrl: null,
    imageAttributionText: asset.attributionText?.trim() ? asset.attributionText.trim() : null,
    imageSource: asset.sourceProvider ?? null,
    imageAttributionRequired: null,
  };
}

export function resolveEntityImage(args: {
  primaryImageAsset?: MediaAssetLike | null;
  fallbackImageAsset?: MediaAssetLike | null;
  legacyImageUrl?: string | null;
}): ResolvedEntityImage | null {
  if (
    canDisplayPrimaryOrGalleryAsset(args.primaryImageAsset) &&
    isDisplayableMediaUrl(args.primaryImageAsset?.assetUrl)
  ) {
    return toResolvedImage(args.primaryImageAsset!, "primary_asset");
  }

  if (
    canDisplayFallbackAsset(args.fallbackImageAsset) &&
    isDisplayableMediaUrl(args.fallbackImageAsset?.assetUrl)
  ) {
    return toResolvedImage(args.fallbackImageAsset!, "fallback_asset");
  }

  const legacyImageUrl = normalizeLegacyImage(args.legacyImageUrl);
  if (!legacyImageUrl || !isDisplayableMediaUrl(legacyImageUrl)) {
    return null;
  }

  return {
    url: legacyImageUrl,
    altText: null,
    isFallback: false,
    sourceKind: "legacy",
    sourceProvider: null,
    attributionText: null,
    attributionUrl: null,
    assetId: null,
    sourceUrl: null,
    imageLicense: null,
    imageDetailUrl: null,
    imageAttributionText: null,
    imageSource: null,
    imageAttributionRequired: null,
  };
}

export function getGalleryMediaAssets(args: {
  mediaAssets?: MediaAssetLike[] | null;
  primaryImageAsset?: MediaAssetLike | null;
  fallbackImageAsset?: MediaAssetLike | null;
  legacyImageUrls?: string[] | null;
}) {
  const excludedIds = new Set(
    [args.primaryImageAsset?.id, args.fallbackImageAsset?.id].filter(Boolean),
  );
  const seenUrls = new Set<string>();
  const galleryAssets =
    args.mediaAssets
      ?.filter((asset) => canDisplayPrimaryOrGalleryAsset(asset))
      .filter((asset) => isDisplayableMediaUrl(asset.assetUrl))
      .filter((asset) => !excludedIds.has(asset.id ?? ""))
      .filter((asset) => {
        if (seenUrls.has(asset.assetUrl)) {
          return false;
        }

        seenUrls.add(asset.assetUrl);
        return true;
      })
      .map((asset) => toResolvedImage(asset, "primary_asset")) ?? [];

  if (galleryAssets.length > 0) {
    return galleryAssets;
  }

  const legacyGallery =
    args.legacyImageUrls
      ?.map((image) => normalizeLegacyImage(image))
      .filter((image): image is string => Boolean(image) && isDisplayableMediaUrl(image))
      .slice(1)
      .filter((image) => !seenUrls.has(image))
      .map<ResolvedEntityImage>((image) => ({
        url: image,
        altText: null,
        isFallback: false,
        sourceKind: "legacy",
        sourceProvider: null,
        attributionText: null,
        attributionUrl: null,
        assetId: null,
        sourceUrl: null,
        imageLicense: null,
        imageDetailUrl: null,
        imageAttributionText: null,
        imageSource: null,
        imageAttributionRequired: null,
      })) ?? [];

  return legacyGallery;
}
