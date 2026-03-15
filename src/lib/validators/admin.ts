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
