import { prisma } from "@/lib/prisma";
import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";

export async function insertPublicCollectionCreatedActivity(userId: string, collectionId: string) {
  await prisma.activity.create({
    data: {
      userId,
      type: ACTIVITY_TYPE.COLLECTION_CREATED,
      entityType: ACTIVITY_ENTITY.collection,
      entityId: collectionId,
    },
  });
}

export async function insertPublicCollectionPlaceAddedActivity(
  userId: string,
  collectionItemId: string,
) {
  await prisma.activity.create({
    data: {
      userId,
      type: ACTIVITY_TYPE.COLLECTION_PLACE_ADDED,
      entityType: ACTIVITY_ENTITY.collection_item,
      entityId: collectionItemId,
    },
  });
}

export async function deleteCollectionPlaceAddedActivity(collectionItemId: string) {
  await prisma.activity.deleteMany({
    where: {
      type: ACTIVITY_TYPE.COLLECTION_PLACE_ADDED,
      entityType: ACTIVITY_ENTITY.collection_item,
      entityId: collectionItemId,
    },
  });
}

/** Removes all feed rows tied to a collection (created + per-item adds). */
export async function deleteAllActivitiesForPlaceCollection(collectionId: string) {
  const items = await prisma.placeCollectionItem.findMany({
    where: { collectionId },
    select: { id: true },
  });
  const itemIds = items.map((i) => i.id);

  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          type: ACTIVITY_TYPE.COLLECTION_CREATED,
          entityType: ACTIVITY_ENTITY.collection,
          entityId: collectionId,
        },
        ...(itemIds.length
          ? [
              {
                type: ACTIVITY_TYPE.COLLECTION_PLACE_ADDED,
                entityType: ACTIVITY_ENTITY.collection_item,
                entityId: { in: itemIds },
              },
            ]
          : []),
      ],
    },
  });
}
