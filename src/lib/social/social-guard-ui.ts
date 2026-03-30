/**
 * Maps server-side social guard codes to `socialSafety` i18n keys (client-safe).
 */
export const SOCIAL_GUARD_MESSAGE_KEY: Record<string, "rateWaitRetry" | "duplicateSent" | "actionUnavailable"> = {
  comment_rate_limited: "rateWaitRetry",
  comment_duplicate: "duplicateSent",
  follow_rate_limited: "rateWaitRetry",
  city_follow_rate_limited: "rateWaitRetry",
  participation_rate_limited: "rateWaitRetry",
  collection_create_rate_limited: "rateWaitRetry",
  collection_duplicate_title: "duplicateSent",
  collection_item_rate_limited: "rateWaitRetry",
};

export function resolveSocialGuardMessage(
  message: string,
  translate: (key: "rateWaitRetry" | "duplicateSent" | "actionUnavailable") => string,
): string | null {
  const key = SOCIAL_GUARD_MESSAGE_KEY[message];
  return key ? translate(key) : null;
}
