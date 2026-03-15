import type { Prisma } from "@prisma/client";

import type { PlacesFilterInput } from "@/lib/validators/places";
import { prisma } from "@/lib/prisma";

import { publicPlaceSelect, type PublicPlaceRecord } from "./shared";

export type ListedPlace = PublicPlaceRecord & {
  isSaved: boolean;
};

export async function listPlaces(args: {
  filters: PlacesFilterInput;
  userId?: string;
}) {
  const where: Prisma.PlaceWhereInput = {
    isPublished: true,
    moderationStatus: "APPROVED",
  };

  if (args.filters.city) {
    where.city = {
      slug: args.filters.city,
    };
  }

  if (args.filters.category) {
    where.category = {
      slug: args.filters.category,
    };
  }

  if (args.filters.q) {
    where.OR = [
      { name: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionDe: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionTr: { contains: args.filters.q, mode: "insensitive" } },
      { addressLine1: { contains: args.filters.q, mode: "insensitive" } },
    ];
  }

  const places = await prisma.place.findMany({
    where,
    orderBy: [
      { verificationStatus: "desc" },
      { createdAt: "desc" },
    ],
    take: 24,
    select: publicPlaceSelect,
  });

  if (!args.userId || places.length === 0) {
    return places.map((place) => ({ ...place, isSaved: false }));
  }

  const savedPlaces = await prisma.savedPlace.findMany({
    where: {
      userId: args.userId,
      placeId: {
        in: places.map((place) => place.id),
      },
    },
    select: {
      placeId: true,
    },
  });

  const savedIds = new Set(savedPlaces.map((entry) => entry.placeId));

  return places.map((place) => ({
    ...place,
    isSaved: savedIds.has(place.id),
  }));
}
