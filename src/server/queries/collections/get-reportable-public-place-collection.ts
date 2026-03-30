import { prisma } from "@/lib/prisma";

/**
 * Only public collections can be reported; returns null if missing or not PUBLIC.
 */
export async function getReportablePublicPlaceCollection(collectionId: string) {
  return prisma.placeCollection.findFirst({
    where: {
      id: collectionId,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
    },
  });
}
