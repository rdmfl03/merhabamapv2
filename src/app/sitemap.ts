import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { listPublicCategoryBrowseSummaries } from "@/server/queries/categories/list-public-category-browse-summaries";
import { buildPublicPlaceWhere, publicPlaceVisibilityWhere } from "@/server/queries/places/shared";

const locales = ["de", "tr"] as const;

const staticPublicPaths = [
  "",
  "/places",
  "/events",
  "/map",
  "/impressum",
  "/privacy",
  "/terms",
  "/community-rules",
  "/contact",
  "/cookies",
  "/categories",
  "/search",
] as const;

function getAppUrl() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPublicPaths.map((path) => ({
      url: `${appUrl}/${locale}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
  );

  try {
    const now = new Date();

    const places = await prisma.place.findMany({
      where: buildPublicPlaceWhere(),
      select: { slug: true, updatedAt: true },
    });
    const events = await prisma.event.findMany({
      where: buildPublicEventWhere(),
      select: { slug: true, updatedAt: true },
    });
    const publicCollections = await prisma.placeCollection.findMany({
      where: { visibility: "PUBLIC" },
      select: { id: true, updatedAt: true },
    });
    const browseCities = await prisma.city.findMany({
      where: {
        OR: [
          { places: { some: publicPlaceVisibilityWhere } },
          { events: { some: buildPublicEventWhere({ startsAt: { gte: now } }) } },
        ],
      },
      select: { slug: true },
    });
    const browseCategories = await listPublicCategoryBrowseSummaries();

    const placeEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      places.map((p) => ({
        url: `${appUrl}/${locale}/places/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    );

    const eventEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      events.map((e) => ({
        url: `${appUrl}/${locale}/events/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    );

    const collectionEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      publicCollections.map((c) => ({
        url: `${appUrl}/${locale}/collections/${c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.55,
      })),
    );

    const cityBrowseEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      browseCities.map((c) => ({
        url: `${appUrl}/${locale}/cities/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      })),
    );

    const categoryBrowseEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      browseCategories.map((c) => ({
        url: `${appUrl}/${locale}/categories/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.68,
      })),
    );

    return [
      ...staticEntries,
      ...cityBrowseEntries,
      ...categoryBrowseEntries,
      ...placeEntries,
      ...eventEntries,
      ...collectionEntries,
    ];
  } catch (error) {
    console.error("Failed to build dynamic sitemap entries", error);
    return staticEntries;
  }
}
