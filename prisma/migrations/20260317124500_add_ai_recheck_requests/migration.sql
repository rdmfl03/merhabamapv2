-- CreateEnum
CREATE TYPE "AiRecheckEntityType" AS ENUM ('event', 'place');

-- CreateEnum
CREATE TYPE "AiRecheckRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

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

-- CreateIndex
CREATE INDEX "ai_recheck_requests_entity_type_entity_id_idx" ON "ai_recheck_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_recheck_requests_status_idx" ON "ai_recheck_requests"("status");

-- CreateIndex
CREATE INDEX "ai_recheck_requests_created_at_idx" ON "ai_recheck_requests"("created_at");

-- AddForeignKey
ALTER TABLE "ai_recheck_requests"
ADD CONSTRAINT "ai_recheck_requests_requested_by_user_id_fkey"
FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
