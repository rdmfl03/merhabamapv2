import "server-only";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email/notifications";
import { shouldSendPasswordReset } from "@/lib/rate-limit/submission-guard";
import {
  consumeUserActionToken,
  createUserActionToken,
  deleteUserActionTokens,
  getUserActionToken,
} from "@/lib/tokens/user-action-tokens";

export async function createAndSendPasswordReset(args: {
  email: string;
  locale: "de" | "tr";
}) {
  const user = await prisma.user.findUnique({
    where: { email: args.email },
    select: {
      id: true,
      email: true,
      preferredLocale: true,
    },
  });

  if (!user?.email) {
    return;
  }

  if (!(await shouldSendPasswordReset(user.id))) {
    return;
  }

  await deleteUserActionTokens({
    userId: user.id,
    type: "PASSWORD_RESET",
  });

  const token = await createUserActionToken({
    userId: user.id,
    type: "PASSWORD_RESET",
    expiresAt: new Date(
      Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    ),
  });

  await sendPasswordResetEmail({
    to: user.email,
    locale: (user.preferredLocale ?? args.locale) as "de" | "tr",
    token,
  });
}

export async function getPasswordResetTokenStatus(token: string) {
  const record = await getUserActionToken({
    token,
    type: "PASSWORD_RESET",
  });

  if (!record || record.type !== "PASSWORD_RESET") {
    return "invalid" as const;
  }

  if (record.consumedAt) {
    return "used" as const;
  }

  if (record.expiresAt <= new Date()) {
    return "expired" as const;
  }

  return "valid" as const;
}

export async function resetPasswordWithToken(args: {
  token: string;
  password: string;
}) {
  const consumed = await consumeUserActionToken({
    token: args.token,
    type: "PASSWORD_RESET",
  });

  if (consumed.status !== "valid") {
    return consumed.status;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: consumed.record.userId },
      data: {
        hashedPassword: hashPassword(args.password),
      },
    });

    await tx.session.deleteMany({
      where: { userId: consumed.record.userId },
    });

    await tx.userActionToken.deleteMany({
      where: {
        userId: consumed.record.userId,
        type: "PASSWORD_RESET",
      },
    });
  });

  return "success" as const;
}
