"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EventParticipationStatus } from "@prisma/client";

import { auth } from "@/auth";
import { toggleEventParticipationSchema } from "@/lib/validators/event-participation";
import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import {
  clearEventParticipationActivities,
  setEventParticipationActivity,
} from "@/server/social/sync-event-participation-activity";

import { sanitizeReturnPath } from "../places/shared";

export type EventParticipationActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const idleEventParticipationActionState: EventParticipationActionState = {
  status: "idle",
};

export async function toggleEventParticipation(
  _previousState: EventParticipationActionState = idleEventParticipationActionState,
  formData: FormData,
): Promise<EventParticipationActionState> {
  void _previousState;

  const parsed = toggleEventParticipationSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    eventId: formData.get("eventId"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const returnPath = sanitizeReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const event = await prisma.event.findFirst({
    where: buildPublicEventWhere({ id: parsed.data.eventId }),
    select: { id: true },
  });

  if (!event) {
    return { status: "error", message: "event_not_found" };
  }

  const { eventId, intent } = parsed.data;
  const userId = session.user.id;

  const current = await prisma.eventParticipation.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
    select: { id: true, status: true },
  });

  const targetInterested = intent === "interested";
  const desiredStatus: EventParticipationStatus = targetInterested ? "INTERESTED" : "GOING";

  if (!current) {
    await prisma.eventParticipation.create({
      data: {
        userId,
        eventId,
        status: desiredStatus,
      },
    });
    await setEventParticipationActivity(userId, eventId, desiredStatus);
  } else if (current.status === desiredStatus) {
    await prisma.eventParticipation.delete({
      where: { id: current.id },
    });
    await clearEventParticipationActivities(userId, eventId);
  } else {
    await prisma.eventParticipation.update({
      where: { id: current.id },
      data: { status: desiredStatus },
    });
    await setEventParticipationActivity(userId, eventId, desiredStatus);
  }

  revalidatePath(returnPath);
  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const un = viewer?.username?.trim();
  if (un) {
    revalidatePath(`/${parsed.data.locale}/user/${un}`);
  }

  return { status: "success" };
}
