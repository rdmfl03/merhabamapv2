"use server";

import { prisma } from "@/lib/prisma";
import { onboardingUsernameSchema } from "@/lib/validators/user";

import { requireAuthenticatedUser } from "./shared";

export type OnboardingUsernameCheckResult =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "available" }
  | { status: "taken" };

/**
 * Authenticated onboarding step: checks whether the handle is free (case-insensitive),
 * excluding the current user. Call on username field blur after the user typed something.
 */
export async function checkOnboardingUsernameAvailability(args: {
  locale: "de" | "tr";
  username: string;
}): Promise<OnboardingUsernameCheckResult> {
  const trimmed = args.username.trim();
  if (trimmed.length === 0) {
    return { status: "empty" };
  }

  const parsed = onboardingUsernameSchema.safeParse(trimmed);
  if (!parsed.success) {
    return { status: "invalid" };
  }

  const user = await requireAuthenticatedUser(args.locale);

  const taken = await prisma.user.findFirst({
    where: {
      username: { equals: parsed.data, mode: "insensitive" },
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  return { status: taken ? "taken" : "available" };
}
