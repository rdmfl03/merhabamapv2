"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { savePlaceSchema } from "@/lib/validators/places";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";
import { insertActivity } from "@/server/social/insert-activity";

import { sanitizeReturnPath } from "./shared";

export async function toggleSavePlace(formData: FormData) {
  const parsed = savePlaceSchema.safeParse({
    locale: formData.get("locale"),
    placeId: formData.get("placeId"),
    returnPath: formData.get("returnPath"),
  });

  if (!parsed.success) {
    return;
  }

  const session = await auth();
  const returnPath = sanitizeReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(
      `/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`,
    );
  }

  const place = await prisma.place.findFirst({
    where: buildPublicPlaceWhere({
      id: parsed.data.placeId,
    }),
    select: {
      id: true,
      slug: true,
    },
  });

  if (!place) {
    return;
  }

  const existing = await prisma.savedPlace.findUnique({
    where: {
      userId_placeId: {
        userId: session.user.id,
        placeId: place.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedPlace.delete({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId: place.id,
        },
      },
    });
  } else {
    await prisma.savedPlace.create({
      data: {
        userId: session.user.id,
        placeId: place.id,
      },
    });

    const existingSaveActivity = await prisma.activity.findFirst({
      where: {
        userId: session.user.id,
        type: ACTIVITY_TYPE.SAVE_PLACE,
        entityId: place.id,
      },
      select: { id: true },
    });

    if (!existingSaveActivity) {
      await insertActivity(prisma, {
        userId: session.user.id,
        type: ACTIVITY_TYPE.SAVE_PLACE,
        entityType: ACTIVITY_ENTITY.place,
        entityId: place.id,
      });
    }
  }

  revalidatePath(returnPath);
  revalidatePath(`/${parsed.data.locale}/places/${place.slug}`);
  revalidatePath(`/${parsed.data.locale}/feed`);

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  const viewerUsername = viewer?.username?.trim();
  if (viewerUsername) {
    revalidatePath(`/${parsed.data.locale}/user/${viewerUsername}`);
  }
}
