import { prisma } from "@/lib/prisma";

export async function listAdminSubmissions() {
  return prisma.submission.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      submissionType: true,
      status: true,
      targetEntityType: true,
      targetEntityId: true,
      submittedByUserId: true,
      sourceUrl: true,
      reviewedByUserId: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
