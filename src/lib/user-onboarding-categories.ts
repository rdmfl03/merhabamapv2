import type { EventCategory } from "@prisma/client";

import { EVENT_CATEGORY_VALUES } from "@/lib/event-category-values";

const EVENT_SET = new Set<string>(EVENT_CATEGORY_VALUES);

export function stringifyPreferredPlaceCategoryIds(ids: string[]) {
  return JSON.stringify(ids);
}

export function stringifyPreferredEventCategories(categories: EventCategory[]) {
  return JSON.stringify(categories);
}

export function parsePreferredPlaceCategoryIds(
  value: string | null | undefined,
): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function parsePreferredEventCategories(
  value: string | null | undefined,
): EventCategory[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is EventCategory =>
      typeof entry === "string" && EVENT_SET.has(entry),
    );
  } catch {
    return [];
  }
}
