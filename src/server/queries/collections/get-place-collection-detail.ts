import { prisma } from "@/lib/prisma";
import {
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
} from "@/server/queries/places/shared";
import { placeIsPubliclyListed } from "@/server/queries/collections/place-collection-visibility";
import type { ListedPlace } from "@/server/queries/places/list-places";

export type PlaceCollectionDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  isOwner: boolean;
  owner: {
    id: string;
    username: string | null;
    name: string | null;
  };
  /** Cards for the current viewer (non-owners only see publicly listed places). */
  items: Array<{ itemId: string; place: ListedPlace }>;
  itemCount: number;
};

export async function getPlaceCollectionDetail(args: {
  collectionId: string;
  viewerUserId: string | null;
}): Promise<PlaceCollectionDetail | null> {
  const row = await prisma.placeCollection.findUnique({
    where: { id: args.collectionId },
    select: {
      id: true,
      title: true,
      description: true,
      visibility: true,
      userId: true,
      user: {
        select: { id: true, username: true, name: true },
      },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          place: { select: publicPlaceSelectWithAi },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const isOwner =
    args.viewerUserId !== null && args.viewerUserId === row.userId;

  if (!isOwner && row.visibility !== "PUBLIC") {
    return null;
  }

  const filteredItems = row.items.filter((item) => {
    if (isOwner) {
      return true;
    }
    return placeIsPubliclyListed(item.place);
  });

  const items = filteredItems.map((item) => ({
    itemId: item.id,
    place: publicPlaceRecordForFlight(item.place, false) as ListedPlace,
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    isOwner,
    owner: row.user,
    items,
    itemCount: items.length,
  };
}
