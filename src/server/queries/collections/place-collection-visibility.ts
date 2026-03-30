import type { ModerationStatus } from "@prisma/client";

/** Same rules as `publicPlaceVisibilityWhere` for listing cards. */
export function placeIsPubliclyListed(place: {
  isPublished: boolean;
  moderationStatus: ModerationStatus;
  aiReviewStatus: string | null;
}): boolean {
  if (!place.isPublished || place.moderationStatus !== "APPROVED") {
    return false;
  }
  return place.aiReviewStatus == null || place.aiReviewStatus !== "REJECT";
}
