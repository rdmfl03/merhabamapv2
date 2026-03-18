import { prisma } from "@/lib/prisma";
import { needsManualReview } from "@/server/queries/ai-shared";

export type AdminAiReviewQueueRow = {
  entityType: string | null;
  entityId: string | null;
  slug: string | null;
  label: string | null;
  cityName: string | null;
  startsAt: Date | string | null;
  aiReviewStatus: string | null;
  aiConfidenceScore: number | null;
  suggestedAction: string | null;
  reasonCodes: string[] | string | null;
  explanation: string | null;
  checkedAt: Date | string | null;
  needsManualReview: boolean;
};

export type AdminAiReviewSummaryRow = {
  aiReviewStatus: string | null;
  count: number;
};

export async function getAdminAiReviewQueue() {
  const rows = await prisma.$queryRaw<Omit<AdminAiReviewQueueRow, "needsManualReview">[]>`
    SELECT
      entity_type AS "entityType",
      entity_id AS "entityId",
      slug,
      COALESCE(label, title, place_name) AS label,
      city_name AS "cityName",
      starts_at AS "startsAt",
      ai_review_status AS "aiReviewStatus",
      ai_confidence_score::float AS "aiConfidenceScore",
      suggested_action AS "suggestedAction",
      reason_codes AS "reasonCodes",
      explanation,
      checked_at AS "checkedAt"
    FROM v_ai_review_queue_all
    ORDER BY
      CASE LOWER(COALESCE(ai_review_status, ''))
        WHEN 'reject' THEN 0
        WHEN 'review' THEN 1
        WHEN 'unsure' THEN 2
        ELSE 3
      END,
      ai_confidence_score DESC NULLS LAST,
      checked_at DESC NULLS LAST
  `;

  return rows.map((row) => ({
    ...row,
    needsManualReview: needsManualReview(row.aiReviewStatus),
  }));
}

export async function getAdminAiReviewSummary() {
  return prisma.$queryRaw<AdminAiReviewSummaryRow[]>`
    SELECT
      ai_review_status AS "aiReviewStatus",
      COUNT(*)::int AS count
    FROM v_ai_review_queue_all
    GROUP BY ai_review_status
    ORDER BY
      CASE LOWER(COALESCE(ai_review_status, ''))
        WHEN 'reject' THEN 0
        WHEN 'review' THEN 1
        WHEN 'unsure' THEN 2
        WHEN 'ok' THEN 3
        ELSE 4
      END
  `;
}
