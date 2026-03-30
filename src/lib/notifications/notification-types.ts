/** In-app inbox only; values match Prisma `NotificationType`. */
export const NOTIFICATION_TYPE = {
  NEW_FOLLOWER: "NEW_FOLLOWER",
  COMMENT_ON_MY_CONTENT: "COMMENT_ON_MY_CONTENT",
} as const;

export type NotificationTypeId = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_ENTITY = {
  place: "place",
  event: "event",
} as const;
