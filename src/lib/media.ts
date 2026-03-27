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
    attributionUrl: asset.attributionUrl ?? null,
    assetId: asset.id ?? null,
  };
}

export function resolveEntityImage(args: {
  primaryImageAsset?: MediaAssetLike | null;
  fallbackImageAsset?: MediaAssetLike | null;
  legacyImageUrl?: string | null;
}): ResolvedEntityImage | null {
  if (canDisplayPrimaryOrGalleryAsset(args.primaryImageAsset)) {
    return toResolvedImage(args.primaryImageAsset!, "primary_asset");
  }

  if (canDisplayFallbackAsset(args.fallbackImageAsset)) {
    return toResolvedImage(args.fallbackImageAsset!, "fallback_asset");
  }

  const legacyImageUrl = normalizeLegacyImage(args.legacyImageUrl);
  if (!legacyImageUrl) {
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
      .filter((image): image is string => Boolean(image))
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
      })) ?? [];

  return legacyGallery;
}
