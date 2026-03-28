import type { MetadataRoute } from "next";

const locales = ["de", "tr"] as const;
const publicPaths = [
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

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return [];
  }

  return locales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: `${appUrl}/${locale}${path}`,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.6,
    })),
  );
}
