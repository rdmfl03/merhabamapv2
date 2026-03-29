import { upsertAllPlaceCategories } from "@/lib/place-category-catalog";
import { prisma } from "@/lib/prisma";

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
