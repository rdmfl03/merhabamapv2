import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_ENTITY } from "@/lib/social/activity-types";

const PROFILE_ACTIVITY_LIMIT = 30;

export type ProfileActivityRow = {
  id: string;
  type: string;
  entity: {
    type: string;
    name: string | null;
    slug: string | null;
  };
  collectionTitle?: string | null;
  cityLabel?: string | null;
  created_at: string;
};

function resolveProfileActivityCityId(
  row: { entityType: string; entityId: string | null },
  placeById: Map<string, { cityId: string }>,
  eventById: Map<string, { cityId: string }>,
  collectionItemById: Map<string, { place: { cityId: string } }>,
): string | null {
  if (!row.entityId) {
    return null;
  }
  if (row.entityType === ACTIVITY_ENTITY.place) {
    return placeById.get(row.entityId)?.cityId ?? null;
  }
  if (row.entityType === ACTIVITY_ENTITY.event) {
    return eventById.get(row.entityId)?.cityId ?? null;
  }
  if (row.entityType === ACTIVITY_ENTITY.collection_item) {
    return collectionItemById.get(row.entityId)?.place.cityId ?? null;
  }
  if (row.entityType === ACTIVITY_ENTITY.city) {
    return row.entityId;
  }
  return null;
}

export async function getUserActivities(
  userId: string,
  locale: "de" | "tr",
): Promise<ProfileActivityRow[]> {
  const activities = await prisma.activity.findMany({
    where: { userId },
    take: PROFILE_ACTIVITY_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });

  const placeIds = new Set<string>();
  const eventIds = new Set<string>();
  const collectionIds = new Set<string>();
  const collectionItemIds = new Set<string>();
  const activityCityIds = new Set<string>();

  for (const row of activities) {
    if (!row.entityId) {
      continue;
    }
    if (row.entityType === ACTIVITY_ENTITY.place) {
      placeIds.add(row.entityId);
    }
    if (row.entityType === ACTIVITY_ENTITY.event) {
      eventIds.add(row.entityId);
    }
    if (row.entityType === ACTIVITY_ENTITY.collection) {
      collectionIds.add(row.entityId);
    }
    if (row.entityType === ACTIVITY_ENTITY.collection_item) {
      collectionItemIds.add(row.entityId);
    }
    if (row.entityType === ACTIVITY_ENTITY.city) {
      activityCityIds.add(row.entityId);
    }
  }

  const [places, events, collections, collectionItems, activityCities] = await Promise.all([
    placeIds.size
      ? prisma.place.findMany({
          where: { id: { in: [...placeIds] } },
          select: { id: true, name: true, slug: true, cityId: true },
        })
      : Promise.resolve([]),
    eventIds.size
      ? prisma.event.findMany({
          where: { id: { in: [...eventIds] } },
          select: { id: true, title: true, slug: true, cityId: true },
        })
      : Promise.resolve([]),
    collectionIds.size
      ? prisma.placeCollection.findMany({
          where: { id: { in: [...collectionIds] } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    collectionItemIds.size
      ? prisma.placeCollectionItem.findMany({
          where: { id: { in: [...collectionItemIds] } },
          select: {
            id: true,
            collection: { select: { title: true } },
            place: { select: { id: true, name: true, slug: true, cityId: true } },
          },
        })
      : Promise.resolve([]),
    activityCityIds.size
      ? prisma.city.findMany({
          where: { id: { in: [...activityCityIds] } },
          select: { id: true, slug: true, nameDe: true, nameTr: true },
        })
      : Promise.resolve([]),
  ]);

  const placeById = new Map(places.map((p) => [p.id, p]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const collectionById = new Map(collections.map((c) => [c.id, c]));
  const collectionItemById = new Map(collectionItems.map((it) => [it.id, it]));
  const cityById = new Map(activityCities.map((c) => [c.id, c]));

  const collectionItemMapForResolve = new Map(
    collectionItems.map((it) => [it.id, { place: { cityId: it.place.cityId } }]),
  );

  const labelCityIds = new Set<string>();
  for (const row of activities) {
    const cid = resolveProfileActivityCityId(row, placeById, eventById, collectionItemMapForResolve);
    if (cid) {
      labelCityIds.add(cid);
    }
  }

  const labelCities =
    labelCityIds.size > 0
      ? await prisma.city.findMany({
          where: { id: { in: [...labelCityIds] } },
          select: { id: true, slug: true, nameDe: true, nameTr: true },
        })
      : [];
  const cityLabelById = new Map(
    labelCities.map((c) => [c.id, getLocalizedCityDisplayName(locale, c)]),
  );

  return activities.map((row) => {
    let name: string | null = null;
    let slug: string | null = null;
    let entityTypeOut = row.entityType;
    let collectionTitle: string | null | undefined;

    if (row.entityId) {
      if (row.entityType === ACTIVITY_ENTITY.place) {
        const p = placeById.get(row.entityId);
        name = p?.name ?? null;
        slug = p?.slug ?? null;
      } else if (row.entityType === ACTIVITY_ENTITY.event) {
        const e = eventById.get(row.entityId);
        name = e?.title ?? null;
        slug = e?.slug ?? null;
      } else if (row.entityType === ACTIVITY_ENTITY.collection) {
        const c = collectionById.get(row.entityId);
        name = c?.title ?? null;
        slug = c?.id ?? null;
      } else if (row.entityType === ACTIVITY_ENTITY.collection_item) {
        const it = collectionItemById.get(row.entityId);
        if (it) {
          entityTypeOut = ACTIVITY_ENTITY.place;
          name = it.place.name;
          slug = it.place.slug;
          collectionTitle = it.collection.title;
        }
      } else if (row.entityType === ACTIVITY_ENTITY.city) {
        const c = cityById.get(row.entityId);
        if (c) {
          name = getLocalizedCityDisplayName(locale, c);
          slug = c.slug;
        }
      }
    }

    const cid = resolveProfileActivityCityId(row, placeById, eventById, collectionItemMapForResolve);
    const cityLabel = cid ? (cityLabelById.get(cid) ?? null) : null;

    const out: ProfileActivityRow = {
      id: row.id,
      type: row.type,
      entity: {
        type: entityTypeOut,
        name,
        slug,
      },
      created_at: row.createdAt.toISOString(),
    };
    if (collectionTitle !== undefined) {
      out.collectionTitle = collectionTitle;
    }
    if (cityLabel) {
      out.cityLabel = cityLabel;
    }
    return out;
  });
}
