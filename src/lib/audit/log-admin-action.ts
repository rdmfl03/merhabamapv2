import { prisma } from "@/lib/prisma";

type LogAdminActionArgs = {
  actorUserId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAction({
  actorUserId,
  actionType,
  targetType,
  targetId,
  summary,
  metadata,
}: LogAdminActionArgs) {
  await prisma.adminActionLog.create({
    data: {
      actorUserId,
      actionType,
      targetType,
      targetId,
      summary,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
