import { PrismaClient } from "@prisma/client";

import { PILOT_CITY_DEFINITIONS } from "@/lib/pilot-cities";

const prisma = new PrismaClient();

async function main() {
  for (const def of PILOT_CITY_DEFINITIONS) {
    await prisma.city.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        nameDe: def.nameDe,
        nameTr: def.nameTr,
        countryCode: "DE",
        isPilot: true,
        lat: def.lat,
        lng: def.lng,
      },
      update: {
        nameDe: def.nameDe,
        nameTr: def.nameTr,
        isPilot: true,
        lat: def.lat,
        lng: def.lng,
        countryCode: "DE",
      },
    });
  }

  console.log(`Upserted ${PILOT_CITY_DEFINITIONS.length} pilot cities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
