import { prisma } from "@/lib/prisma";

export type PublicPlaceCollectionCard = {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
};

export async function listPublicPlaceCollectionsByUser(
  profileUserId: string,
): Promise<PublicPlaceCollectionCard[]> {
  const rows = await prisma.placeCollection.findMany({
    where: { userId: profileUserId, visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { items: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    itemCount: row._count.items,
  }));
}
