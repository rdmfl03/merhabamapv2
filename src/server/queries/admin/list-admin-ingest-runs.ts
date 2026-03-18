import { prisma } from "@/lib/prisma";

export async function listAdminIngestRuns() {
  return prisma.ingestRun.findMany({
    orderBy: [{ startedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      pipelineName: true,
      triggerType: true,
      status: true,
      itemsFound: true,
      itemsCreated: true,
      itemsUpdated: true,
      itemsFailed: true,
      startedAt: true,
      finishedAt: true,
      source: {
        select: {
          name: true,
          url: true,
        },
      },
    },
  });
}
