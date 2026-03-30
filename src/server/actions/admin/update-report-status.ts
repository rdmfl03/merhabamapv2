"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { prisma } from "@/lib/prisma";
import { updateReportStatusSchema } from "@/lib/validators/admin";

import { idleAdminActionState, type AdminActionState } from "./state";
import {
  requireAdminAccess,
} from "./shared";

export async function updateReportStatus(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  const parsed = updateReportStatusSchema.safeParse({
    locale: formData.get("locale"),
    reportId: formData.get("reportId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: {
      id: true,
      status: true,
      targetType: true,
      placeId: true,
      eventId: true,
      entityCommentId: true,
      placeCollectionId: true,
    },
  });

  if (!report) {
    return { status: "error", message: "report_not_found" };
  }

  await prisma.report.update({
    where: { id: report.id },
    data: {
      status: parsed.data.nextStatus,
      reviewedAt: new Date(),
      reviewedByUserId: actor.id,
    },
  });

  await logAdminAction({
    actorUserId: actor.id,
    actionType: `REPORT_${parsed.data.nextStatus}`,
    targetType: "REPORT",
    targetId: report.id,
    summary: `Report status changed to ${parsed.data.nextStatus}`,
    metadata: {
      previousStatus: report.status,
      nextStatus: parsed.data.nextStatus,
      reportTargetType: report.targetType,
      placeId: report.placeId,
      eventId: report.eventId,
      entityCommentId: report.entityCommentId,
      placeCollectionId: report.placeCollectionId,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/admin/reports`);
  revalidatePath(`/${parsed.data.locale}/admin/reports/${report.id}`);

  return { status: "success", message: "report_updated" };
}
