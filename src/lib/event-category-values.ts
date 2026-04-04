import type { EventCategory } from "@prisma/client";

/** All persisted event categories (matches Prisma `EventCategory`). */
export const EVENT_CATEGORY_VALUES: readonly EventCategory[] = [
  "CONCERT",
  "CULTURE",
  "STUDENT",
  "COMMUNITY",
  "FAMILY",
  "BUSINESS",
  "RELIGIOUS",
];
