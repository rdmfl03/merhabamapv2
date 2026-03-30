import { prisma } from "@/lib/prisma";

export type MyPlaceCollectionRow = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  itemCount: number;
  updatedAt: Date;
};

export async function listMyPlaceCollections(userId: string): Promise<MyPlaceCollectionRow[]> {
  const rows = await prisma.placeCollection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      visibility: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    itemCount: row._count.items,
    updatedAt: row.updatedAt,
  }));
}
