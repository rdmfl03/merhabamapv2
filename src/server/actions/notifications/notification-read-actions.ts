"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateNotificationSurfaces } from "@/server/queries/notifications/revalidate-notification-paths";

const markOneSchema = z.object({
  notificationId: z.string().cuid(),
  locale: z.enum(["de", "tr"]),
});

export async function markNotificationRead(formData: FormData) {
  const parsed = markOneSchema.safeParse({
    notificationId: formData.get("notificationId"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    return;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidateNotificationSurfaces();
}

export async function markAllNotificationsRead(formData: FormData) {
  const locale = formData.get("locale");
  if (locale !== "de" && locale !== "tr") {
    return;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidateNotificationSurfaces();
}
