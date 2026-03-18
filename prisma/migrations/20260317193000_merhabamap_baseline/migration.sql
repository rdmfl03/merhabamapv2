-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserActionTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'BUSINESS_OWNER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AiRecheckEntityType" AS ENUM ('event', 'place');

-- CreateEnum
CREATE TYPE "AiRecheckRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('de', 'tr');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'CLAIMED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONCERT', 'CULTURE', 'STUDENT', 'COMMUNITY', 'FAMILY', 'BUSINESS', 'RELIGIOUS');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('PLACE', 'EVENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_action_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "UserActionTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "hashed_password" TEXT,
    "email_verified" TIMESTAMP(3),
    "name" TEXT,
    "username" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "preferred_locale" "Locale",
    "onboarding_completed_at" TIMESTAMP(3),
    "interests_json" TEXT,
    "onboarding_city_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_tr" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'DE',
    "is_pilot" BOOLEAN NOT NULL DEFAULT false,
    "state_code" TEXT,
    "ags" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "source" TEXT,
    "source_updated_at" TIMESTAMP(6),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_tr" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "place_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description_de" TEXT,
    "description_tr" TEXT,
    "category_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "address_line_1" TEXT,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "website_url" TEXT,
    "opening_hours_json" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verified_at" TIMESTAMP(3),
    "verified_by_user_id" TEXT,
    "last_business_update_at" TIMESTAMP(3),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ai_review_status" TEXT,
    "ai_confidence_score" DECIMAL(5,4),
    "ai_last_checked_at" TIMESTAMP(6),

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description_de" TEXT,
    "description_tr" TEXT,
    "category" "EventCategory" NOT NULL,
    "city_id" TEXT NOT NULL,
    "venue_name" TEXT,
    "address_line_1" TEXT,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "organizer_name" TEXT,
    "external_url" TEXT,
    "image_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ai_review_status" TEXT,
    "ai_confidence_score" DECIMAL(5,4),
    "ai_last_checked_at" TIMESTAMP(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_places" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_claims" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "claimant_email" TEXT NOT NULL,
    "claimant_phone" TEXT,
    "message" TEXT,
    "evidence_notes" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "target_type" "ReportTargetType" NOT NULL,
    "place_id" TEXT,
    "event_id" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recheck_requests" (
    "id" TEXT NOT NULL,
    "entity_type" "AiRecheckEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "status" "AiRecheckRequestStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recheck_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "source_kind" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "account_handle" TEXT,
    "external_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trust_score" INTEGER NOT NULL DEFAULT 50,
    "discovery_method" TEXT,
    "notes" TEXT,
    "last_checked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sources" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "external_ref" TEXT,
    "observed_title" TEXT,
    "observed_datetime_text" TEXT,
    "observed_location_text" TEXT,
    "first_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_runs" (
    "id" TEXT NOT NULL,
    "pipeline_name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "source_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_created" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "items_failed" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(6),
    "log_text" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description_de" TEXT,
    "description_tr" TEXT,
    "website_url" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "instagram_handle" TEXT,
    "tiktok_handle" TEXT,
    "facebook_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_sources" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "external_ref" TEXT,
    "observed_name" TEXT,
    "observed_address" TEXT,
    "observed_phone" TEXT,
    "observed_website" TEXT,
    "first_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_ingest_items" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "entity_guess" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "source_url" TEXT,
    "external_id" TEXT,
    "raw_title" TEXT,
    "raw_text" TEXT,
    "raw_datetime_text" TEXT,
    "raw_location_text" TEXT,
    "raw_image_url" TEXT,
    "raw_payload_json" TEXT NOT NULL,
    "language_hint" TEXT,
    "city_guess" TEXT,
    "country_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(6),
    "ingested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_ingest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "submission_type" TEXT NOT NULL,
    "target_entity_type" TEXT,
    "target_entity_id" TEXT,
    "submitted_by_user_id" TEXT,
    "payload_json" TEXT NOT NULL,
    "source_url" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quality_checks" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "ai_status" TEXT NOT NULL,
    "confidence_score" DECIMAL(5,4),
    "reason_codes" JSONB,
    "explanation" TEXT,
    "suggested_action" TEXT,
    "raw_result_json" JSONB,
    "checked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_action_tokens_token_hash_key" ON "user_action_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "user_action_tokens_user_id_type_idx" ON "user_action_tokens"("user_id", "type");

-- CreateIndex
CREATE INDEX "user_action_tokens_expires_at_idx" ON "user_action_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_state_code_idx" ON "cities"("state_code");

-- CreateIndex
CREATE INDEX "cities_country_code_idx" ON "cities"("country_code");

-- CreateIndex
CREATE INDEX "cities_lat_lng_idx" ON "cities"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "place_categories_slug_key" ON "place_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE INDEX "places_city_id_idx" ON "places"("city_id");

-- CreateIndex
CREATE INDEX "places_category_id_idx" ON "places"("category_id");

-- CreateIndex
CREATE INDEX "places_owner_user_id_idx" ON "places"("owner_user_id");

-- CreateIndex
CREATE INDEX "places_moderation_status_idx" ON "places"("moderation_status");

-- CreateIndex
CREATE INDEX "places_is_published_idx" ON "places"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_city_id_idx" ON "events"("city_id");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_is_published_idx" ON "events"("is_published");

-- CreateIndex
CREATE INDEX "events_moderation_status_idx" ON "events"("moderation_status");

-- CreateIndex
CREATE INDEX "events_title_trgm_idx" ON "events" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "events_unique_event" ON "events"("title", "city_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_unique_title_city_starts_at" ON "events"("title", "city_id", "starts_at");

-- CreateIndex
CREATE INDEX "saved_places_user_id_idx" ON "saved_places"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_places_user_id_place_id_key" ON "saved_places"("user_id", "place_id");

-- CreateIndex
CREATE INDEX "saved_events_user_id_idx" ON "saved_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_events_user_id_event_id_key" ON "saved_events"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "business_claims_place_id_idx" ON "business_claims"("place_id");

-- CreateIndex
CREATE INDEX "business_claims_status_idx" ON "business_claims"("status");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_target_type_idx" ON "reports"("target_type");

-- CreateIndex
CREATE INDEX "reports_place_id_idx" ON "reports"("place_id");

-- CreateIndex
CREATE INDEX "reports_event_id_idx" ON "reports"("event_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_actor_user_id_idx" ON "admin_action_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_target_type_target_id_idx" ON "admin_action_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "ai_recheck_requests_entity_type_entity_id_idx" ON "ai_recheck_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_recheck_requests_status_idx" ON "ai_recheck_requests"("status");

-- CreateIndex
CREATE INDEX "ai_recheck_requests_created_at_idx" ON "ai_recheck_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sources_url_key" ON "sources"("url");

-- CreateIndex
CREATE INDEX "sources_is_active_idx" ON "sources"("is_active");

-- CreateIndex
CREATE INDEX "sources_platform_idx" ON "sources"("platform");

-- CreateIndex
CREATE INDEX "sources_source_kind_idx" ON "sources"("source_kind");

-- CreateIndex
CREATE INDEX "sources_trust_score_idx" ON "sources"("trust_score");

-- CreateIndex
CREATE INDEX "event_sources_event_id_idx" ON "event_sources"("event_id");

-- CreateIndex
CREATE INDEX "event_sources_is_primary_idx" ON "event_sources"("is_primary");

-- CreateIndex
CREATE INDEX "event_sources_last_seen_at_idx" ON "event_sources"("last_seen_at");

-- CreateIndex
CREATE INDEX "event_sources_source_id_idx" ON "event_sources"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_sources_event_id_source_id_source_url_key" ON "event_sources"("event_id", "source_id", "source_url");

-- CreateIndex
CREATE INDEX "ingest_runs_finished_at_idx" ON "ingest_runs"("finished_at");

-- CreateIndex
CREATE INDEX "ingest_runs_pipeline_name_idx" ON "ingest_runs"("pipeline_name");

-- CreateIndex
CREATE INDEX "ingest_runs_source_id_idx" ON "ingest_runs"("source_id");

-- CreateIndex
CREATE INDEX "ingest_runs_started_at_idx" ON "ingest_runs"("started_at");

-- CreateIndex
CREATE INDEX "ingest_runs_status_idx" ON "ingest_runs"("status");

-- CreateIndex
CREATE INDEX "ingest_runs_trigger_type_idx" ON "ingest_runs"("trigger_type");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_slug_key" ON "organizers"("slug");

-- CreateIndex
CREATE INDEX "organizers_is_verified_idx" ON "organizers"("is_verified");

-- CreateIndex
CREATE INDEX "organizers_name_idx" ON "organizers"("name");

-- CreateIndex
CREATE INDEX "place_sources_is_primary_idx" ON "place_sources"("is_primary");

-- CreateIndex
CREATE INDEX "place_sources_last_seen_at_idx" ON "place_sources"("last_seen_at");

-- CreateIndex
CREATE INDEX "place_sources_place_id_idx" ON "place_sources"("place_id");

-- CreateIndex
CREATE INDEX "place_sources_source_id_idx" ON "place_sources"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_sources_place_id_source_id_source_url_key" ON "place_sources"("place_id", "source_id", "source_url");

-- CreateIndex
CREATE INDEX "raw_ingest_items_entity_guess_idx" ON "raw_ingest_items"("entity_guess");

-- CreateIndex
CREATE INDEX "raw_ingest_items_external_id_idx" ON "raw_ingest_items"("external_id");

-- CreateIndex
CREATE INDEX "raw_ingest_items_ingested_at_idx" ON "raw_ingest_items"("ingested_at");

-- CreateIndex
CREATE INDEX "raw_ingest_items_platform_idx" ON "raw_ingest_items"("platform");

-- CreateIndex
CREATE INDEX "raw_ingest_items_processed_at_idx" ON "raw_ingest_items"("processed_at");

-- CreateIndex
CREATE INDEX "raw_ingest_items_source_id_idx" ON "raw_ingest_items"("source_id");

-- CreateIndex
CREATE INDEX "raw_ingest_items_status_idx" ON "raw_ingest_items"("status");

-- CreateIndex
CREATE INDEX "submissions_created_at_idx" ON "submissions"("created_at");

-- CreateIndex
CREATE INDEX "submissions_reviewed_by_user_id_idx" ON "submissions"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_submission_type_idx" ON "submissions"("submission_type");

-- CreateIndex
CREATE INDEX "submissions_submitted_by_user_id_idx" ON "submissions"("submitted_by_user_id");

-- CreateIndex
CREATE INDEX "submissions_target_entity_id_idx" ON "submissions"("target_entity_id");

-- CreateIndex
CREATE INDEX "submissions_target_entity_type_idx" ON "submissions"("target_entity_type");

-- CreateIndex
CREATE INDEX "ai_quality_checks_entity_idx" ON "ai_quality_checks"("entity_type", "entity_id", "checked_at" DESC);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_action_tokens" ADD CONSTRAINT "user_action_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_onboarding_city_id_fkey" FOREIGN KEY ("onboarding_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "place_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recheck_requests" ADD CONSTRAINT "ai_recheck_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingest_runs" ADD CONSTRAINT "ingest_runs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "raw_ingest_items" ADD CONSTRAINT "raw_ingest_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

