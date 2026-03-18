import { prisma } from "@/lib/prisma";

export async function listAdminRawIngestItems() {
  return prisma.rawIngestItem.findMany({
    where: {
      status: {
        in: ["FAILED", "PENDING"],
      },
    },
    orderBy: [
      { status: "asc" },
      { ingestedAt: "desc" },
    ],
    take: 100,
    select: {
      id: true,
      sourceId: true,
      entityGuess: true,
      sourceUrl: true,
      externalId: true,
      rawTitle: true,
      rawDatetimeText: true,
      rawLocationText: true,
      languageHint: true,
      cityGuess: true,
      processedAt: true,
      ingestedAt: true,
      errorMessage: true,
      status: true,
      source: {
        select: {
          name: true,
          url: true,
        },
      },
    },
  });
}
