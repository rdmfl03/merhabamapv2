"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendReportReceivedEmail } from "@/lib/email/notifications";
import { prisma } from "@/lib/prisma";
import { getReportSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import { eventReportSchema } from "@/lib/validators/events";

import {
  idleEventActionState,
  sanitizeEventReturnPath,
  type EventActionState,
} from "./shared";

export async function submitEventReport(
  _previousState: EventActionState = idleEventActionState,
  formData: FormData,
): Promise<EventActionState> {
  void _previousState;

  const parsed = eventReportSchema.safeParse({
    locale: formData.get("locale"),
    eventId: formData.get("eventId"),
    returnPath: formData.get("returnPath"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "validation_error",
    };
  }

  const session = await auth();
  const returnPath = sanitizeEventReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const event = await prisma.event.findFirst({
    where: {
      id: parsed.data.eventId,
      isPublished: true,
      moderationStatus: "APPROVED",
    },
    select: { id: true, title: true },
  });

  if (!event) {
    return {
      status: "error",
      message: "event_not_found",
    };
  }

  const reportGuard = await getReportSubmissionGuard({
    userId: session.user.id,
    targetType: "EVENT",
    eventId: event.id,
  });

  if (reportGuard) {
    return {
      status: "error",
      message: reportGuard,
    };
  }

  await prisma.report.create({
    data: {
      userId: session.user.id,
      targetType: "EVENT",
      eventId: event.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  if (session.user.email) {
    await sendReportReceivedEmail({
      to: session.user.email,
      targetLabel: event.title,
    });
  }

  revalidatePath(returnPath);

  return {
    status: "success",
    message: "report_submitted",
  };
}
