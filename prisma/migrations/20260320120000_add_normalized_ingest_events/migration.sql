CREATE TABLE "normalized_ingest_events" (
    "id" TEXT NOT NULL,
    "raw_ingest_item_id" TEXT NOT NULL,
    "event_id" TEXT,
    "city_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "venue_name" TEXT,
    "starts_at" TIMESTAMP(6) NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_category" TEXT,
    "normalization_status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalized_ingest_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "normalized_ingest_events_raw_ingest_item_id_key" ON "normalized_ingest_events"("raw_ingest_item_id");
CREATE UNIQUE INDEX "normalized_ingest_events_event_id_key" ON "normalized_ingest_events"("event_id");
CREATE INDEX "normalized_ingest_events_city_id_idx" ON "normalized_ingest_events"("city_id");
CREATE INDEX "normalized_ingest_events_normalization_status_idx" ON "normalized_ingest_events"("normalization_status");
CREATE INDEX "normalized_ingest_events_starts_at_idx" ON "normalized_ingest_events"("starts_at");

ALTER TABLE "normalized_ingest_events"
ADD CONSTRAINT "normalized_ingest_events_raw_ingest_item_id_fkey"
FOREIGN KEY ("raw_ingest_item_id") REFERENCES "raw_ingest_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "normalized_ingest_events"
ADD CONSTRAINT "normalized_ingest_events_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "normalized_ingest_events"
ADD CONSTRAINT "normalized_ingest_events_city_id_fkey"
FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
