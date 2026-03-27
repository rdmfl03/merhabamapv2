# Images and Ratings Foundation

This document defines the stable target model for images and ratings in `merhabamap`.

Important boundary:
- `merhabamap` defines the target schema and product semantics first.
- `merhabamap-ingest` is a later producer for this model.
- The schema in this document is not derived backwards from ingest.

## Scope

This foundation introduces:
- product-facing image summary fields on `Place`
- product-facing image summary fields on `Event`
- product-facing rating summary fields on `Place`
- normalized supporting tables for media and multi-source place ratings

This branch intentionally does not introduce:
- persistent third-party review text storage
- a native event rating model
- ingest-side population logic

## Product-Facing Fields

### `Place`

Product-facing summary fields now live directly on `Place`:
- `primaryImageAssetId`
- `fallbackImageAssetId`
- `imageSetStatus`
- `displayRatingValue`
- `displayRatingCount`
- `ratingSourceCount`
- `ratingSummaryUpdatedAt`

Meaning:
- `primaryImageAssetId`: points to the preferred real image asset for public display.
- `fallbackImageAssetId`: points to an explicitly marked fallback asset that can be shown when no real image exists.
- `imageSetStatus`: entity-level state for image readiness:
  - `REAL_IMAGE_AVAILABLE`
  - `FALLBACK_ONLY`
  - `MISSING`
- `displayRatingValue`: place-facing rating value normalized to a 0-5 display scale.
- `displayRatingCount`: aggregate rating count from the active included source rows. This is not a deduplicated human count across providers.
- `ratingSourceCount`: count of active source rows that are included in the displayed summary.
- `ratingSummaryUpdatedAt`: when the product-facing summary was last recalculated.

### `Event`

Product-facing summary fields now live directly on `Event`:
- `primaryImageAssetId`
- `fallbackImageAssetId`
- `imageSetStatus`
- `venuePlaceId`

Meaning:
- `primaryImageAssetId`: points to the preferred real event image.
- `fallbackImageAssetId`: points to an explicitly marked fallback image.
- `imageSetStatus`: same semantics as on `Place`.
- `venuePlaceId`: canonical link from an event to the matched place record for later venue-based rating reuse.

Events do not get a native event rating summary in this branch.

## Normalized Supporting Tables

### `MediaAsset`

`MediaAsset` is the normalized target for displayable place and event images.

Key fields:
- ownership: `placeId` or `eventId`
- payload: `assetUrl`, `altText`, `sortOrder`
- provenance: `sourceProvider`, `sourceId`, `sourceUrl`, `externalRef`
- semantics: `role`, `status`, `rightsStatus`
- attribution: `attributionText`, `attributionUrl`
- auditability: `observedAt`, `createdAt`, `updatedAt`

Enums:
- `MediaAssetRole`
  - `PRIMARY_CANDIDATE`
  - `GALLERY`
  - `FALLBACK`
- `MediaAssetStatus`
  - `ACTIVE`
  - `HIDDEN`
  - `REJECTED`
  - `PENDING_REVIEW`
- `MediaRightsStatus`
  - `UNKNOWN`
  - `DISPLAY_ALLOWED`
  - `DISPLAY_RESTRICTED`
  - `INTERNAL_FALLBACK_ONLY`
- `MediaSourceProvider`
  - `GOOGLE`
  - `YELP`
  - `TRIPADVISOR`
  - `MERHABAMAP`
  - `OTHER`

Rules:
- gallery assets are not fallback assets
- fallback assets must be explicitly marked as `FALLBACK`
- fallback assets must never be presented as if they were confirmed real photos of the place or event

### `PlaceRatingSource`

`PlaceRatingSource` is the normalized target for multi-source place ratings.

Key fields:
- relation: `placeId`
- provenance: `provider`, `sourceId`, `sourceUrl`, `externalRef`
- rating state: `status`, `ratingValue`, `ratingCount`, `scaleMax`, `isIncludedInDisplay`
- attribution/rights: `attributionText`, `attributionUrl`, `reviewTextRightsStatus`
- auditability: `observedAt`, `createdAt`, `updatedAt`

Enums:
- `RatingSourceProvider`
  - `GOOGLE`
  - `YELP`
  - `TRIPADVISOR`
  - `MERHABAMAP`
  - `OTHER`
- `PlaceRatingSourceStatus`
  - `ACTIVE`
  - `HIDDEN`
  - `REJECTED`
  - `PENDING_REVIEW`
- `ReviewTextRightsStatus`
  - `UNKNOWN`
  - `NOT_STORED`
  - `DISPLAY_RESTRICTED`

Rules:
- `ratingValue` is stored on a normalized 0-5 display scale
- `scaleMax` preserves the original provider scale reference
- `ratingCount` is the provider-side count, not a cross-platform deduplicated user count
- `isIncludedInDisplay` controls whether a source participates in the product-facing summary

## SEO and Structured Data

Place structured data may include aggregate rating only when:
- a display summary exists
- `displayRatingCount > 0`
- the rating summary is in a valid public display state

Events do not emit rating structured data in this branch.

## Temporary Legacy Fields

These legacy fields remain temporarily for compatibility:
- `Place.images`
- `Event.imageUrl`

They are transitional only:
- current UI performs a compatibility fallback read from them
- they are not the target architecture
- new producers should populate `MediaAsset` plus entity summary fields instead

## Current Read Strategy

Public UI now follows this order:

1. displayable primary asset
2. explicit fallback asset
3. legacy transport image field
4. existing gradient/no-image UI

This preserves compatibility until ingest and backfill are updated.

## What `merhabamap-ingest` Must Populate Later

`merhabamap-ingest` should later become a controlled producer for this model by:
- creating `MediaAsset` rows instead of writing only to `Place.images` or `Event.imageUrl`
- setting `primaryImageAssetId` and `fallbackImageAssetId`
- setting `imageSetStatus`
- creating `PlaceRatingSource` rows for supported providers
- recalculating `displayRatingValue`
- recalculating `displayRatingCount`
- recalculating `ratingSourceCount`
- recalculating `ratingSummaryUpdatedAt`
- linking `Event.venuePlaceId` when an event venue matches a canonical place

## Deferred Areas

Intentionally deferred from this branch:
- persistent third-party review snippets or full review text mirroring
- native event rating summaries
- owner/business image management workflows
- moderation workflow redesign
- automatic ingest-side backfill

## Safety Notes

The schema intentionally bakes in:
- attribution fields
- explicit rights status
- explicit fallback semantics
- multi-source rating support
- audit timestamps

This keeps the product model conservative, traceable, and DSGVO-safer than the previous single-field image approach.
