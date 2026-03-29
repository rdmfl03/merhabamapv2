import { PrismaClient } from "@prisma/client";

import { upsertAllPlaceCategories } from "@/lib/place-category-catalog";

const prisma = new PrismaClient();

async function main() {
  await upsertAllPlaceCategories(prisma);
  console.log("Place categories upserted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
