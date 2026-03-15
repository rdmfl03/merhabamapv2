import "server-only";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendVerificationEmail } from "@/lib/email/notifications";
import {
  consumeUserActionToken,
  createUserActionToken,
  deleteUserActionTokens,
} from "@/lib/tokens/user-action-tokens";

export async function createAndSendEmailVerification(args: {
  userId: string;
  email: string;
  locale: "de" | "tr";
}) {
  const token = await createUserActionToken({
    userId: args.userId,
    type: "EMAIL_VERIFICATION",
    expiresAt: new Date(
      Date.now() + env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    ),
  });

  await sendVerificationEmail({
    to: args.email,
    locale: args.locale,
    token,
  });
}

export async function verifyEmailToken(token: string) {
  const consumed = await consumeUserActionToken({
    token,
    type: "EMAIL_VERIFICATION",
  });

  if (consumed.status !== "valid") {
    return consumed;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: consumed.record.user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    await tx.userActionToken.deleteMany({
      where: {
        userId: consumed.record.user.id,
        type: "EMAIL_VERIFICATION",
      },
    });
  });

  return { status: "success" as const };
}

export async function resendVerificationForEmail(args: {
  email: string;
  locale: "de" | "tr";
}) {
  const user = await prisma.user.findUnique({
    where: { email: args.email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      preferredLocale: true,
    },
  });

  if (!user?.email || user.emailVerified) {
    return;
  }

  await deleteUserActionTokens({
    userId: user.id,
    type: "EMAIL_VERIFICATION",
  });

  await createAndSendEmailVerification({
    userId: user.id,
    email: user.email,
    locale: (user.preferredLocale ?? args.locale) as "de" | "tr",
  });
}
