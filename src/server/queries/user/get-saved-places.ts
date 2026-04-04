import { prisma } from "@/lib/prisma";
import {
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
} from "@/server/queries/places/shared";

export async function countSavedPlacesForUser(userId: string) {
  return prisma.savedPlace.count({ where: { userId } });
}

export async function getSavedPlaces(userId: string) {
  const saved = await prisma.savedPlace.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      place: {
        select: publicPlaceSelectWithAi,
      },
    },
  });

  return saved.map((entry) => publicPlaceRecordForFlight(entry.place, true));
}
