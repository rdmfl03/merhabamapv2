"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import {
  getPlaceCollectionCreateGuard,
  getPlaceCollectionItemAddGuard,
} from "@/lib/rate-limit/social-action-guard";
import { prisma } from "@/lib/prisma";
import {
  createPlaceCollectionSchema,
  deletePlaceCollectionSchema,
  placeCollectionMembershipSchema,
  updatePlaceCollectionSchema,
} from "@/lib/validators/place-collections";
import { sanitizeReturnPath } from "@/server/actions/places/shared";
import { assertPlaceCollectible } from "@/server/queries/collections/assert-place-collectible";
import {
  deleteAllActivitiesForPlaceCollection,
  deleteCollectionPlaceAddedActivity,
  insertPublicCollectionCreatedActivity,
  insertPublicCollectionPlaceAddedActivity,
} from "@/server/social/collection-activities";

import type { PlaceCollectionActionState } from "./place-collection-action-state";

function revalidateCollectionPaths(locale: "de" | "tr", returnPath: string, collectionId?: string) {
  revalidatePath(`/${locale}/collections`);
  if (collectionId) {
    revalidatePath(`/${locale}/collections/${collectionId}`);
  }
  if (returnPath.startsWith(`/${locale}`)) {
    revalidatePath(returnPath);
  }
  revalidatePath(`/${locale}/feed`);
}

async function revalidateProfileForUser(userId: string, locale: "de" | "tr") {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const un = u?.username?.trim();
  if (un) {
    revalidatePath(`/${locale}/user/${un}`);
  }
}

export async function createPlaceCollection(
  _prev: PlaceCollectionActionState,
  formData: FormData,
): Promise<PlaceCollectionActionState> {
  const parsed = createPlaceCollectionSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const userId = session.user.id;

  const createGuard = await getPlaceCollectionCreateGuard({
    userId,
    title: parsed.data.title,
  });
  if (createGuard) {
    return { status: "error", message: createGuard };
  }

  const collection = await prisma.placeCollection.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
    },
    select: { id: true },
  });

  if (parsed.data.visibility === "PUBLIC") {
    await insertPublicCollectionCreatedActivity(userId, collection.id);
  }

  revalidateCollectionPaths(locale, returnPath, collection.id);
  await revalidateProfileForUser(userId, locale);

  return { status: "success" };
}

export async function updatePlaceCollection(
  _prev: PlaceCollectionActionState,
  formData: FormData,
): Promise<PlaceCollectionActionState> {
  const parsed = updatePlaceCollectionSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    collectionId: formData.get("collectionId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const existing = await prisma.placeCollection.findFirst({
    where: { id: parsed.data.collectionId, userId: session.user.id },
    select: { visibility: true },
  });
  if (!existing) {
    return { status: "error", message: "not_found" };
  }

  if (existing.visibility === "PUBLIC" && parsed.data.visibility === "PRIVATE") {
    await deleteAllActivitiesForPlaceCollection(parsed.data.collectionId);
  }

  await prisma.placeCollection.update({
    where: { id: parsed.data.collectionId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
    },
  });

  revalidateCollectionPaths(locale, returnPath, parsed.data.collectionId);
  await revalidateProfileForUser(session.user.id, locale);

  return { status: "success" };
}

export async function deletePlaceCollection(
  _prev: PlaceCollectionActionState,
  formData: FormData,
): Promise<PlaceCollectionActionState> {
  const parsed = deletePlaceCollectionSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    collectionId: formData.get("collectionId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const existing = await prisma.placeCollection.findFirst({
    where: { id: parsed.data.collectionId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { status: "error", message: "not_found" };
  }

  await deleteAllActivitiesForPlaceCollection(parsed.data.collectionId);
  await prisma.placeCollection.delete({
    where: { id: parsed.data.collectionId },
  });

  revalidateCollectionPaths(locale, returnPath);
  await revalidateProfileForUser(session.user.id, locale);

  return { status: "success" };
}

export async function addPlaceToCollection(
  _prev: PlaceCollectionActionState,
  formData: FormData,
): Promise<PlaceCollectionActionState> {
  const parsed = placeCollectionMembershipSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    collectionId: formData.get("collectionId"),
    placeId: formData.get("placeId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const userId = session.user.id;

  const collection = await prisma.placeCollection.findFirst({
    where: { id: parsed.data.collectionId, userId },
    select: { id: true, visibility: true },
  });
  if (!collection) {
    return { status: "error", message: "not_found" };
  }

  try {
    await assertPlaceCollectible(parsed.data.placeId, userId);
  } catch {
    return { status: "error", message: "place_not_collectible" };
  }

  const already = await prisma.placeCollectionItem.findUnique({
    where: {
      collectionId_placeId: {
        collectionId: collection.id,
        placeId: parsed.data.placeId,
      },
    },
    select: { id: true },
  });
  if (already) {
    return { status: "success" };
  }

  const itemGuard = await getPlaceCollectionItemAddGuard(userId);
  if (itemGuard) {
    return { status: "error", message: itemGuard };
  }

  let itemId: string;
  try {
    const item = await prisma.placeCollectionItem.create({
      data: {
        collectionId: collection.id,
        placeId: parsed.data.placeId,
      },
      select: { id: true },
    });
    itemId = item.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      revalidateCollectionPaths(locale, returnPath, collection.id);
      await revalidateProfileForUser(userId, locale);
      return { status: "success" };
    }
    throw e;
  }

  if (collection.visibility === "PUBLIC") {
    await insertPublicCollectionPlaceAddedActivity(userId, itemId);
  }

  revalidateCollectionPaths(locale, returnPath, collection.id);
  await revalidateProfileForUser(userId, locale);

  return { status: "success" };
}

export async function removePlaceFromCollection(
  _prev: PlaceCollectionActionState,
  formData: FormData,
): Promise<PlaceCollectionActionState> {
  const parsed = placeCollectionMembershipSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    collectionId: formData.get("collectionId"),
    placeId: formData.get("placeId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const userId = session.user.id;

  const collection = await prisma.placeCollection.findFirst({
    where: { id: parsed.data.collectionId, userId },
    select: { id: true },
  });
  if (!collection) {
    return { status: "error", message: "not_found" };
  }

  const item = await prisma.placeCollectionItem.findUnique({
    where: {
      collectionId_placeId: {
        collectionId: parsed.data.collectionId,
        placeId: parsed.data.placeId,
      },
    },
    select: { id: true },
  });

  if (item) {
    await deleteCollectionPlaceAddedActivity(item.id);
    await prisma.placeCollectionItem.delete({
      where: { id: item.id },
    });
  }

  revalidateCollectionPaths(locale, returnPath, collection.id);
  await revalidateProfileForUser(userId, locale);

  return { status: "success" };
}
