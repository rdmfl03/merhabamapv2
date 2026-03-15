import { prisma } from "@/lib/prisma";

export async function getCurrentUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      image: true,
      role: true,
      preferredLocale: true,
      onboardingCompletedAt: true,
      interestsJson: true,
      onboardingCity: {
        select: {
          id: true,
          slug: true,
          nameDe: true,
          nameTr: true,
        },
      },
    },
  });
}
