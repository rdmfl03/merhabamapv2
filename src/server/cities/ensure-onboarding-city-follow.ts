import { prisma } from "@/lib/prisma";

/**
 * Ensures the user's onboarding city appears under "Meine Städte" (city_follows).
 * Idempotent; further cities are added via the map as usual.
 * @returns onboarding city id when set, otherwise null
 */
export async function ensureCityFollowForOnboardingCity(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCityId: true },
  });

  const cityId = user?.onboardingCityId;
  if (!cityId) {
    return null;
  }

  await prisma.cityFollow.upsert({
    where: {
      userId_cityId: { userId, cityId },
    },
    create: { userId, cityId },
    update: {},
  });

  return cityId;
}
