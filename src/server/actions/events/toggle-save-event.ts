"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveEventSchema } from "@/lib/validators/events";
import { buildPublicEventWhere } from "@/server/queries/events/shared";

import { trackProductInsight } from "@/server/product-insights/track-product-insight";

import { sanitizeEventReturnPath } from "./shared";

export async function toggleSaveEvent(formData: FormData) {
  const parsed = saveEventSchema.safeParse({
    locale: formData.get("locale"),
    eventId: formData.get("eventId"),
    returnPath: formData.get("returnPath"),
  });

  if (!parsed.success) {
    return;
  }

  const session = await auth();
  const returnPath = sanitizeEventReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const event = await prisma.event.findFirst({
    where: buildPublicEventWhere({
      id: parsed.data.eventId,
    }),
    select: {
      id: true,
      slug: true,
    },
  });

  if (!event) {
    return;
  }

  const existing = await prisma.savedEvent.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId: event.id,
      },
    },
    select: {
      id: true,
    },
  });

  let saveAdded = false;
  if (existing) {
    await prisma.savedEvent.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: event.id,
        },
      },
    });
    saveAdded = false;
  } else {
    await prisma.savedEvent.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
      },
    });
    saveAdded = true;
  }

  await trackProductInsight({
    name: "save_click",
    payload: {
      locale: parsed.data.locale,
      authenticated: true,
      entityType: "event",
      eventId: event.id,
      saveAdded,
    },
  });

  revalidatePath(returnPath);
  revalidatePath(`/${parsed.data.locale}/events/${event.slug}`);
}
