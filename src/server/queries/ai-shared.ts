type AiSortableRecord = {
  aiReviewStatus?: string | null;
  aiConfidenceScore?: unknown;
};

const manualReviewStatuses = new Set(["REVIEW", "UNSURE", "REJECT"]);

export function normalizeAiReviewStatus(status: string | null | undefined) {
  const normalized = status?.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "OK" || normalized === "REVIEW" || normalized === "UNSURE" || normalized === "REJECT") {
    return normalized;
  }

  return null;
}

export function needsManualReview(status: string | null | undefined) {
  const raw = status?.trim();

  if (!raw) {
    return false;
  }

  const normalized = normalizeAiReviewStatus(status);

  if (normalized === "OK") {
    return false;
  }

  if (normalized) {
    return manualReviewStatuses.has(normalized);
  }

  return true;
}

function getAiRankingPriority(status: string | null | undefined) {
  const normalized = normalizeAiReviewStatus(status);

  switch (normalized) {
    case "OK":
      return 0;
    case null:
      return 1;
    case "REVIEW":
      return 2;
    case "UNSURE":
      return 3;
    case "REJECT":
      return 4;
    default:
      return 1;
  }
}

function toComparableConfidence(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "object") {
    if ("toNumber" in value && typeof value.toNumber === "function") {
      const parsed = value.toNumber();
      return Number.isFinite(parsed) ? parsed : null;
    }

    if ("valueOf" in value && typeof value.valueOf === "function") {
      const parsed = Number(value.valueOf());
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

export function compareByAiRanking<T extends AiSortableRecord>(
  left: T,
  right: T,
  fallback: (left: T, right: T) => number,
) {
  const priorityDiff =
    getAiRankingPriority(left.aiReviewStatus) - getAiRankingPriority(right.aiReviewStatus);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const leftConfidence = toComparableConfidence(left.aiConfidenceScore);
  const rightConfidence = toComparableConfidence(right.aiConfidenceScore);

  if (leftConfidence == null && rightConfidence != null) {
    return 1;
  }

  if (leftConfidence != null && rightConfidence == null) {
    return -1;
  }

  if (leftConfidence != null && rightConfidence != null && leftConfidence !== rightConfidence) {
    return rightConfidence - leftConfidence;
  }

  return fallback(left, right);
}
