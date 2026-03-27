CREATE TYPE "ImageSetStatus" AS ENUM (
    'REAL_IMAGE_AVAILABLE',
    'FALLBACK_ONLY',
    'MISSING'
);

CREATE TYPE "MediaAssetRole" AS ENUM (
    'PRIMARY_CANDIDATE',
    'GALLERY',
    'FALLBACK'
);

CREATE TYPE "MediaAssetStatus" AS ENUM (
    'ACTIVE',
    'HIDDEN',
    'REJECTED',
    'PENDING_REVIEW'
);

CREATE TYPE "MediaRightsStatus" AS ENUM (
    'UNKNOWN',
    'DISPLAY_ALLOWED',
    'DISPLAY_RESTRICTED',
    'INTERNAL_FALLBACK_ONLY'
);

CREATE TYPE "MediaSourceProvider" AS ENUM (
    'GOOGLE',
    'YELP',
    'TRIPADVISOR',
    'MERHABAMAP',
    'OTHER'
);

CREATE TYPE "RatingSourceProvider" AS ENUM (
    'GOOGLE',
    'YELP',
    'TRIPADVISOR',
    'MERHABAMAP',
    'OTHER'
);

CREATE TYPE "PlaceRatingSourceStatus" AS ENUM (
    'ACTIVE',
    'HIDDEN',
    'REJECTED',
    'PENDING_REVIEW'
);

CREATE TYPE "ReviewTextRightsStatus" AS ENUM (
    'UNKNOWN',
    'NOT_STORED',
    'DISPLAY_RESTRICTED'
);

ALTER TABLE "places"
ADD COLUMN "primary_image_asset_id" TEXT,
ADD COLUMN "fallback_image_asset_id" TEXT,
ADD COLUMN "image_set_status" "ImageSetStatus" NOT NULL DEFAULT 'MISSING',
ADD COLUMN "display_rating_value" DECIMAL(3,2),
ADD COLUMN "display_rating_count" INTEGER,
ADD COLUMN "rating_source_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rating_summary_updated_at" TIMESTAMP(6);

ALTER TABLE "events"
ADD COLUMN "primary_image_asset_id" TEXT,
ADD COLUMN "fallback_image_asset_id" TEXT,
ADD COLUMN "image_set_status" "ImageSetStatus" NOT NULL DEFAULT 'MISSING',
ADD COLUMN "venue_place_id" TEXT;

CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "place_id" TEXT,
    "event_id" TEXT,
    "source_id" TEXT,
    "asset_url" TEXT NOT NULL,
    "source_provider" "MediaSourceProvider" NOT NULL,
    "source_url" TEXT,
    "external_ref" TEXT,
    "role" "MediaAssetRole" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rights_status" "MediaRightsStatus" NOT NULL DEFAULT 'UNKNOWN',
    "attribution_text" TEXT,
    "attribution_url" TEXT,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "observed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_assets_entity_owner_check" CHECK (num_nonnulls("place_id", "event_id") = 1),
    CONSTRAINT "media_assets_sort_order_check" CHECK ("sort_order" >= 0)
);

CREATE TABLE "place_rating_sources" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "source_id" TEXT,
    "provider" "RatingSourceProvider" NOT NULL,
    "source_url" TEXT,
    "external_ref" TEXT,
    "status" "PlaceRatingSourceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rating_value" DECIMAL(3,2) NOT NULL,
    "rating_count" INTEGER NOT NULL,
    "scale_max" DECIMAL(4,2) NOT NULL,
    "is_included_in_display" BOOLEAN NOT NULL DEFAULT true,
    "observed_at" TIMESTAMP(6),
    "attribution_text" TEXT,
    "attribution_url" TEXT,
    "review_text_rights_status" "ReviewTextRightsStatus" NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "place_rating_sources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "place_rating_sources_rating_value_check" CHECK ("rating_value" >= 0 AND "rating_value" <= 5),
    CONSTRAINT "place_rating_sources_rating_count_check" CHECK ("rating_count" >= 0),
    CONSTRAINT "place_rating_sources_scale_max_check" CHECK ("scale_max" > 0)
);

ALTER TABLE "places"
ADD CONSTRAINT "places_display_rating_value_check" CHECK ("display_rating_value" IS NULL OR ("display_rating_value" >= 0 AND "display_rating_value" <= 5)),
ADD CONSTRAINT "places_display_rating_count_check" CHECK ("display_rating_count" IS NULL OR "display_rating_count" >= 0),
ADD CONSTRAINT "places_rating_source_count_check" CHECK ("rating_source_count" >= 0);

CREATE INDEX "places_image_set_status_idx" ON "places"("image_set_status");
CREATE INDEX "places_primary_image_asset_id_idx" ON "places"("primary_image_asset_id");
CREATE INDEX "places_fallback_image_asset_id_idx" ON "places"("fallback_image_asset_id");

CREATE INDEX "events_image_set_status_idx" ON "events"("image_set_status");
CREATE INDEX "events_primary_image_asset_id_idx" ON "events"("primary_image_asset_id");
CREATE INDEX "events_fallback_image_asset_id_idx" ON "events"("fallback_image_asset_id");
CREATE INDEX "events_venue_place_id_idx" ON "events"("venue_place_id");

CREATE INDEX "media_assets_place_id_status_role_sort_order_idx" ON "media_assets"("place_id", "status", "role", "sort_order");
CREATE INDEX "media_assets_event_id_status_role_sort_order_idx" ON "media_assets"("event_id", "status", "role", "sort_order");
CREATE INDEX "media_assets_source_id_idx" ON "media_assets"("source_id");
CREATE INDEX "media_assets_source_provider_idx" ON "media_assets"("source_provider");
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");
CREATE INDEX "media_assets_rights_status_idx" ON "media_assets"("rights_status");

CREATE INDEX "place_rating_sources_place_id_status_is_included_in_display_idx" ON "place_rating_sources"("place_id", "status", "is_included_in_display");
CREATE INDEX "place_rating_sources_source_id_idx" ON "place_rating_sources"("source_id");
CREATE INDEX "place_rating_sources_provider_idx" ON "place_rating_sources"("provider");
CREATE INDEX "place_rating_sources_observed_at_idx" ON "place_rating_sources"("observed_at");

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_place_id_fkey"
FOREIGN KEY ("place_id") REFERENCES "places"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id")
ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "place_rating_sources"
ADD CONSTRAINT "place_rating_sources_place_id_fkey"
FOREIGN KEY ("place_id") REFERENCES "places"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "place_rating_sources"
ADD CONSTRAINT "place_rating_sources_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id")
ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "places"
ADD CONSTRAINT "places_primary_image_asset_id_fkey"
FOREIGN KEY ("primary_image_asset_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "places"
ADD CONSTRAINT "places_fallback_image_asset_id_fkey"
FOREIGN KEY ("fallback_image_asset_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_primary_image_asset_id_fkey"
FOREIGN KEY ("primary_image_asset_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_fallback_image_asset_id_fkey"
FOREIGN KEY ("fallback_image_asset_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_venue_place_id_fkey"
FOREIGN KEY ("venue_place_id") REFERENCES "places"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
