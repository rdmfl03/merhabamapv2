import type { MetadataRoute } from "next";

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

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/de/admin/",
        "/tr/admin/",
        "/de/auth/",
        "/tr/auth/",
        "/de/profile",
        "/tr/profile",
        "/de/saved",
        "/tr/saved",
        "/de/business",
        "/tr/business",
      ],
    },
    sitemap: appUrl ? `${appUrl}/sitemap.xml` : undefined,
    host: appUrl,
  };
}
