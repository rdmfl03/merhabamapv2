import { z } from "zod";

import { routing } from "@/i18n/routing";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

export const SOCIAL_REPORT_REASONS = [
  "INACCURATE_INFORMATION",
  "DUPLICATE",
  "CLOSED_OR_UNAVAILABLE",
  "INAPPROPRIATE_CONTENT",
  "SPAM_OR_ABUSE",
  "OTHER",
] as const;

const reasonEnum = z.enum(SOCIAL_REPORT_REASONS);

const baseSocialReportSchema = z.object({
  locale: z.enum(routing.locales),
  returnPath: z.string().min(1).max(300),
  reason: reasonEnum,
  details: trimmedOptionalString.pipe(z.string().max(1000).optional()),
});

export const entityCommentReportSchema = baseSocialReportSchema.extend({
  commentId: z.string().cuid(),
});

export const placeCollectionReportSchema = baseSocialReportSchema.extend({
  collectionId: z.string().cuid(),
});

export type EntityCommentReportInput = z.infer<typeof entityCommentReportSchema>;
export type PlaceCollectionReportInput = z.infer<typeof placeCollectionReportSchema>;
