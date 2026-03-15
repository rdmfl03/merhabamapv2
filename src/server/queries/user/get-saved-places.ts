import { prisma } from "@/lib/prisma";
import { publicPlaceSelect } from "@/server/queries/places/shared";

export async function getSavedPlaces(userId: string) {
  const saved = await prisma.savedPlace.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      place: {
        select: publicPlaceSelect,
      },
    },
  });

  return saved.map((entry) => ({
    ...entry.place,
    isSaved: true,
  }));
}
