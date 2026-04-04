import { prisma } from "@/lib/prisma";

/** All German cities in the DB (for onboarding/profile city pickers — not limited to pilot or “active” content). */
export async function getGermanCitiesForForms() {
  return prisma.city.findMany({
    where: { countryCode: "DE" },
    orderBy: [{ nameDe: "asc" }],
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });
}
