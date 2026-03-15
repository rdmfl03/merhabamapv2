import "server-only";

import type { ReportTargetType, UserActionTokenType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_RESET_RESEND_WINDOW_MS = 15 * 60 * 1000;
const CLAIM_RESUBMIT_WINDOW_MS = 12 * 60 * 60 * 1000;
const REPORT_DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;
const REPORT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const REPORT_DAILY_LIMIT = 5;

function windowStart(windowMs: number) {
  return new Date(Date.now() - windowMs);
}

async function hasRecentActionToken(args: {
  userId: string;
  type: UserActionTokenType;
  windowMs: number;
}) {
  const count = await prisma.userActionToken.count({
    where: {
      userId: args.userId,
      type: args.type,
      createdAt: {
        gte: windowStart(args.windowMs),
      },
    },
  });

  return count > 0;
}

export async function shouldSendVerificationEmail(userId: string) {
  return !(await hasRecentActionToken({
    userId,
    type: "EMAIL_VERIFICATION",
    windowMs: EMAIL_VERIFICATION_RESEND_WINDOW_MS,
  }));
}

export async function shouldSendPasswordReset(userId: string) {
  return !(await hasRecentActionToken({
    userId,
    type: "PASSWORD_RESET",
    windowMs: PASSWORD_RESET_RESEND_WINDOW_MS,
  }));
}

export async function getClaimSubmissionGuard(args: {
  userId: string;
  placeId: string;
}) {
  const recentClaim = await prisma.businessClaim.findFirst({
    where: {
      userId: args.userId,
      placeId: args.placeId,
      createdAt: {
        gte: windowStart(CLAIM_RESUBMIT_WINDOW_MS),
      },
    },
    select: {
      id: true,
    },
  });

  if (recentClaim) {
    return "claim_cooldown" as const;
  }

  return null;
}

export async function getReportSubmissionGuard(args: {
  userId: string;
  targetType: ReportTargetType;
  placeId?: string;
  eventId?: string;
}) {
  const duplicateTargetCount = await prisma.report.count({
    where: {
      userId: args.userId,
      targetType: args.targetType,
      placeId: args.placeId,
      eventId: args.eventId,
      createdAt: {
        gte: windowStart(REPORT_DUPLICATE_WINDOW_MS),
      },
    },
  });

  if (duplicateTargetCount > 0) {
    return "report_cooldown" as const;
  }

  const recentReportsCount = await prisma.report.count({
    where: {
      userId: args.userId,
      createdAt: {
        gte: windowStart(REPORT_DAILY_WINDOW_MS),
      },
    },
  });

  if (recentReportsCount >= REPORT_DAILY_LIMIT) {
    return "report_daily_limit" as const;
  }

  return null;
}
