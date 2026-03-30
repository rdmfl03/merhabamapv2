import { prisma } from "@/lib/prisma";

export type FollowedCityRow = {
  id: string;
  slug: string;
  nameDe: string;
  nameTr: string;
};

export async function listFollowedCitiesForUser(userId: string): Promise<FollowedCityRow[]> {
  const rows = await prisma.cityFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      city: {
        select: { id: true, slug: true, nameDe: true, nameTr: true },
      },
    },
  });

  return rows.map((r) => r.city);
}

export async function getFollowedCityIdsForUser(userId: string): Promise<string[]> {
  const rows = await prisma.cityFollow.findMany({
    where: { userId },
    select: { cityId: true },
  });
  return rows.map((r) => r.cityId);
}

export async function isUserFollowingCity(userId: string, cityId: string): Promise<boolean> {
  const row = await prisma.cityFollow.findUnique({
    where: {
      userId_cityId: {
        userId,
        cityId,
      },
    },
    select: { id: true },
  });
  return Boolean(row);
}
