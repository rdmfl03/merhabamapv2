import { z } from "zod";

import { routing } from "@/i18n/routing";

export const updateReportStatusSchema = z.object({
  locale: z.enum(routing.locales),
  reportId: z.string().cuid(),
  nextStatus: z.enum(["IN_REVIEW", "RESOLVED", "REJECTED"]),
});

export const updateClaimStatusSchema = z.object({
  locale: z.enum(routing.locales),
  claimId: z.string().cuid(),
  nextStatus: z.enum(["APPROVED", "REJECTED"]),
});

export const updatePlaceTrustSchema = z.object({
  locale: z.enum(routing.locales),
  placeId: z.string().cuid(),
  nextStatus: z.enum(["UNVERIFIED", "CLAIMED", "VERIFIED"]),
});

export const updateAiModerationSchema = z.object({
  locale: z.enum(routing.locales),
  entityType: z.enum(["event", "place"]),
  entityId: z.string().cuid(),
  action: z.enum(["OK", "REVIEW", "REJECT", "RERUN"]),
});

export const updateEntityModerationSchema = z.object({
  locale: z.enum(routing.locales),
  entityType: z.enum(["PLACE", "EVENT"]),
  entityId: z.string().cuid(),
  nextStatus: z.enum(["APPROVED", "REJECTED"]),
  rejectConfirmation: z.enum(["confirmed"]).optional(),
});
