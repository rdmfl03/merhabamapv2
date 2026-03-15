import { prisma } from "@/lib/prisma";

export async function getAdminReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      targetType: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      reviewedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      place: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: {
            select: {
              nameDe: true,
              nameTr: true,
            },
          },
        },
      },
      event: {
        select: {
          id: true,
          slug: true,
          title: true,
          city: {
            select: {
              nameDe: true,
              nameTr: true,
            },
          },
        },
      },
    },
  });
}
