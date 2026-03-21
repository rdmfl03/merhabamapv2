CREATE TYPE "NormalizedIngestEventStatus" AS ENUM (
    'PENDING_REVIEW',
    'APPROVED_FOR_PROMOTION',
    'PROMOTED',
    'REJECTED',
    'DUPLICATE',
    'STALE',
    'SUPERSEDED'
);

ALTER TABLE "normalized_ingest_events"
ALTER COLUMN "normalization_status" DROP DEFAULT,
ALTER COLUMN "normalization_status" TYPE "NormalizedIngestEventStatus"
USING "normalization_status"::"NormalizedIngestEventStatus",
ALTER COLUMN "normalization_status" SET DEFAULT 'PENDING_REVIEW';

ALTER TABLE "normalized_ingest_events"
ADD COLUMN "reviewed_by_user_id" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(6),
ADD COLUMN "review_note" TEXT,
ADD COLUMN "promoted_at" TIMESTAMP(6);

CREATE INDEX "normalized_ingest_events_reviewed_by_user_id_idx" ON "normalized_ingest_events"("reviewed_by_user_id");

ALTER TABLE "submissions"
ADD COLUMN "normalized_ingest_event_id" TEXT;

CREATE INDEX "submissions_normalized_ingest_event_id_idx" ON "submissions"("normalized_ingest_event_id");
