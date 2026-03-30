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
        "/de/home",
        "/tr/home",
        "/de/feed",
        "/tr/feed",
        "/de/notifications",
        "/tr/notifications",
        "/de/onboarding",
        "/tr/onboarding",
        "/de/profile",
        "/tr/profile",
        "/de/saved",
        "/tr/saved",
        "/de/business",
        "/tr/business",
        "/de/submit/",
        "/tr/submit/",
      ],
    },
    sitemap: appUrl ? `${appUrl}/sitemap.xml` : undefined,
    host: appUrl,
  };
}
