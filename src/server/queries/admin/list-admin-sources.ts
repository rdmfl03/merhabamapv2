import { prisma } from "@/lib/prisma";

export async function listAdminSources() {
  return prisma.source.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
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
    },
  });
}
