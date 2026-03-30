import { prisma } from "@/lib/prisma";

export type AdminReportCommentParent = {
  kind: "place" | "event";
  slug: string;
  label: string;
};

export async function getAdminReportById(id: string) {
  const report = await prisma.report.findUnique({
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
      placeId: true,
      eventId: true,
      entityCommentId: true,
      placeCollectionId: true,
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
      entityComment: {
        select: {
          id: true,
          content: true,
          entityType: true,
          entityId: true,
        },
      },
      placeCollection: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!report) {
    return null;
  }

  let commentParent: AdminReportCommentParent | null = null;
  if (report.targetType === "ENTITY_COMMENT" && report.entityComment) {
    const ec = report.entityComment;
    if (ec.entityType === "place") {
      const p = await prisma.place.findUnique({
        where: { id: ec.entityId },
        select: { slug: true, name: true },
      });
      if (p) {
        commentParent = { kind: "place", slug: p.slug, label: p.name };
      }
    } else if (ec.entityType === "event") {
      const e = await prisma.event.findUnique({
        where: { id: ec.entityId },
        select: { slug: true, title: true },
      });
      if (e) {
        commentParent = { kind: "event", slug: e.slug, label: e.title };
      }
    }
  }

  return { ...report, commentParent };
}
