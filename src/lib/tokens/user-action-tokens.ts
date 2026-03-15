import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { UserActionTokenType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserActionToken(args: {
  userId: string;
  type: UserActionTokenType;
  expiresAt: Date;
}) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.userActionToken.deleteMany({
    where: {
      userId: args.userId,
      type: args.type,
    },
  });

  await prisma.userActionToken.create({
    data: {
      userId: args.userId,
      type: args.type,
      tokenHash,
      expiresAt: args.expiresAt,
    },
  });

  return rawToken;
}

export async function getUserActionToken(args: {
  token: string;
  type: UserActionTokenType;
}) {
  const tokenHash = hashToken(args.token);

  return prisma.userActionToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          preferredLocale: true,
          emailVerified: true,
        },
      },
    },
  });
}

export async function consumeUserActionToken(args: {
  token: string;
  type: UserActionTokenType;
}) {
  const tokenHash = hashToken(args.token);
  const record = await prisma.userActionToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          preferredLocale: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!record || record.type !== args.type) {
    return { status: "invalid" as const };
  }

  if (record.consumedAt) {
    return { status: "used" as const, record };
  }

  if (record.expiresAt <= new Date()) {
    return { status: "expired" as const, record };
  }

  const now = new Date();
  const consumed = await prisma.userActionToken.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: { consumedAt: now },
  });

  if (consumed.count !== 1) {
    return { status: "used" as const, record };
  }

  return {
    status: "valid" as const,
    record: {
      ...record,
      consumedAt: now,
    },
  };
}

export async function deleteUserActionTokens(args: {
  userId: string;
  type: UserActionTokenType;
}) {
  await prisma.userActionToken.deleteMany({
    where: {
      userId: args.userId,
      type: args.type,
    },
  });
}
