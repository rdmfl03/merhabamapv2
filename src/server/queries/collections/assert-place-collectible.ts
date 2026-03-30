import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

/** Public listing rules OR saved by this user. */
export async function assertPlaceCollectible(placeId: string, userId: string): Promise<void> {
  const publicPlace = await prisma.place.findFirst({
    where: buildPublicPlaceWhere({ id: placeId }),
    select: { id: true },
  });
  if (publicPlace) {
    return;
  }

  const saved = await prisma.savedPlace.findUnique({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
    select: { id: true },
  });
  if (saved) {
    return;
  }

  throw new Error("place_not_collectible");
}
