"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
    select: { id: true },
  });

  if (!event) {
    return {
      status: "error",
      message: "event_not_found",
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

  revalidatePath(returnPath);

  return {
    status: "success",
    message: "report_submitted",
  };
}
