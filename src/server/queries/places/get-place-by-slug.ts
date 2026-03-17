import { prisma } from "@/lib/prisma";

import { buildPublicPlaceWhere, publicPlaceSelect } from "./shared";

export async function getPlaceBySlug(args: {
  slug: string;
  userId?: string;
}) {
  const place = await prisma.place.findFirst({
    where: buildPublicPlaceWhere({
      slug: args.slug,
    }),
    select: publicPlaceSelect,
  });

  if (!place) {
    return null;
  }

  if (!args.userId) {
    return { ...place, isSaved: false };
  }

  const saved = await prisma.savedPlace.findUnique({
    where: {
      userId_placeId: {
        userId: args.userId,
        placeId: place.id,
      },
    },
    select: {
      id: true,
    },
  });

  return {
    ...place,
    isSaved: Boolean(saved),
  };
}
