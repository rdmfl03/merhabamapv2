import { prisma } from "@/lib/prisma";

export async function getActiveCities() {
  return prisma.city.findMany({
    where: {
      isPilot: true,
    },
    orderBy: {
      nameDe: "asc",
    },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });
}
