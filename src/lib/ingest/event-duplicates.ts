import { normalizeSubmissionText } from "@/lib/submissions";

const DUPLICATE_STARTS_AT_WINDOW_MS = 2 * 60 * 60 * 1000;

type DuplicateCandidate = {
  id: string;
  title: string;
  venueName?: string | null;
  startsAt: Date;
};

type DuplicateTarget = {
  title: string;
  venueName?: string | null;
  startsAt: Date;
};

function normalizeVenue(value: string | null | undefined) {
  const normalized = normalizeSubmissionText(value);
  return normalized || null;
}

export function getEventDuplicateSearchWindow(startsAt: Date) {
  return {
    gte: new Date(startsAt.getTime() - DUPLICATE_STARTS_AT_WINDOW_MS),
    lte: new Date(startsAt.getTime() + DUPLICATE_STARTS_AT_WINDOW_MS),
  };
}

export function findMatchingEventDuplicate<T extends DuplicateCandidate>(
  target: DuplicateTarget,
  candidates: T[],
) {
  const normalizedTargetTitle = normalizeSubmissionText(target.title);
  const normalizedTargetVenue = normalizeVenue(target.venueName);

  return (
    candidates.find((candidate) => {
      const sameNormalizedTitle = normalizeSubmissionText(candidate.title) === normalizedTargetTitle;
      return sameNormalizedTitle && candidate.startsAt.getTime() === target.startsAt.getTime();
    }) ??
    candidates.find((candidate) => {
      const sameNormalizedTitle = normalizeSubmissionText(candidate.title) === normalizedTargetTitle;
      const normalizedCandidateVenue = normalizeVenue(candidate.venueName);
      const venueMatches =
        Boolean(normalizedTargetVenue) &&
        Boolean(normalizedCandidateVenue) &&
        normalizedCandidateVenue === normalizedTargetVenue;

      return (
        sameNormalizedTitle &&
        venueMatches &&
        Math.abs(candidate.startsAt.getTime() - target.startsAt.getTime()) <=
          DUPLICATE_STARTS_AT_WINDOW_MS
      );
    }) ??
    null
  );
}
