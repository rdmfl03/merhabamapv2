import { prisma } from "@/lib/prisma";

import {
  buildPublicPlaceWhere,
  normalizePlaceRatingSourcesForClient,
  publicPlaceDetailSelect,
} from "./shared";

export async function getPlaceBySlug(args: {
  slug: string;
  userId?: string;
}) {
  const place = await prisma.place.findFirst({
    where: buildPublicPlaceWhere({
      slug: args.slug,
    }),
    select: publicPlaceDetailSelect,
  });

  if (!place) {
    return null;
  }

  const placeForApp = {
    ...place,
    displayRatingValue:
      place.displayRatingValue != null ? Number(place.displayRatingValue) : null,
    placeRatingSources: normalizePlaceRatingSourcesForClient(place.placeRatingSources),
  };

  if (!args.userId) {
    return { ...placeForApp, isSaved: false };
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
    ...placeForApp,
    isSaved: Boolean(saved),
  };
}
