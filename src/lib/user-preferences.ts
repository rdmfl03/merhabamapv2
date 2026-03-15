import { z } from "zod";

export const interestValues = [
  "FOOD",
  "EVENTS",
  "FAMILY",
  "STUDENTS",
  "BUSINESS",
  "SHOPPING",
  "COMMUNITY",
] as const;

export const interestEnum = z.enum(interestValues);

export type UserInterest = (typeof interestValues)[number];

export function parseUserInterests(value: string | null | undefined): UserInterest[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as string[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is UserInterest =>
      interestValues.includes(entry as UserInterest),
    );
  } catch {
    return [];
  }
}

export function stringifyUserInterests(interests: UserInterest[]) {
  return JSON.stringify(interests);
}
