import { prisma } from "@/lib/prisma";

export async function getAdminSourceById(id: string) {
  return prisma.source.findUnique({
    where: { id },
    select: {
      id: true,
      sourceKind: true,
      name: true,
      url: true,
      accountHandle: true,
      externalId: true,
      isPublic: true,
      isActive: true,
      trustScore: true,
      discoveryMethod: true,
      lastCheckedAt: true,
      createdAt: true,
      updatedAt: true,
      ingestRuns: {
        orderBy: [{ startedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          pipelineName: true,
          triggerType: true,
          status: true,
          itemsFound: true,
          itemsCreated: true,
          itemsUpdated: true,
          itemsFailed: true,
          startedAt: true,
          finishedAt: true,
        },
      },
      rawIngestItems: {
        where: {
          status: {
            in: ["FAILED", "PENDING"],
          },
        },
        orderBy: [{ ingestedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          status: true,
          entityGuess: true,
          rawTitle: true,
          rawDatetimeText: true,
          rawLocationText: true,
          languageHint: true,
          cityGuess: true,
          sourceUrl: true,
          externalId: true,
          errorMessage: true,
          ingestedAt: true,
          processedAt: true,
        },
      },
    },
  });
}
