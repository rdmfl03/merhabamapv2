import { prisma } from "@/lib/prisma";

export type UserActivationSignals = {
  followedCityCount: number;
  savedPlaces: number;
  savedEvents: number;
  collectionsCount: number;
  contributionPlaces: number;
  contributionEvents: number;
};

/** Explicit product counts only — no scoring. */
export async function getUserActivationSignals(userId: string): Promise<UserActivationSignals> {
  const [
    followedCityCount,
    savedPlaces,
    savedEvents,
    collectionsCount,
    contributionAgg,
  ] = await Promise.all([
    prisma.cityFollow.count({ where: { userId } }),
    prisma.savedPlace.count({ where: { userId } }),
    prisma.savedEvent.count({ where: { userId } }),
    prisma.placeCollection.count({ where: { userId } }),
    prisma.entityContribution.groupBy({
      by: ["entityType"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  let contributionPlaces = 0;
  let contributionEvents = 0;
  for (const row of contributionAgg) {
    if (row.entityType === "PLACE") {
      contributionPlaces = row._count._all;
    } else if (row.entityType === "EVENT") {
      contributionEvents = row._count._all;
    }
  }

  return {
    followedCityCount,
    savedPlaces,
    savedEvents,
    collectionsCount,
    contributionPlaces,
    contributionEvents,
  };
}
