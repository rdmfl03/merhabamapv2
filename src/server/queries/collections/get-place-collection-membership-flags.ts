import { prisma } from "@/lib/prisma";

export type PlaceCollectionMembershipRow = {
  id: string;
  title: string;
  visibility: "PRIVATE" | "PUBLIC";
  containsPlace: boolean;
};

export async function getPlaceCollectionMembershipFlags(
  userId: string,
  placeId: string,
): Promise<PlaceCollectionMembershipRow[]> {
  const rows = await prisma.placeCollection.findMany({
    where: { userId },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      visibility: true,
      items: {
        where: { placeId },
        select: { id: true },
        take: 1,
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    visibility: row.visibility,
    containsPlace: row.items.length > 0,
  }));
}
