import { prisma } from "@/lib/prisma";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 80;

export type ProductInsightSnapshot = {
  since: Date;
  countsByName: { name: string; count: number }[];
  recent: {
    id: string;
    name: string;
    payload: unknown;
    createdAt: Date;
  }[];
};

export async function getProductInsightSnapshot(): Promise<ProductInsightSnapshot> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [grouped, recent] = await Promise.all([
    prisma.productInsightEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { name: "asc" },
    }),
    prisma.productInsightEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        name: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    since,
    countsByName: grouped.map((g) => ({ name: g.name, count: g._count.id })),
    recent,
  };
}
