import type { Metadata } from "next";

import { appConfig } from "@/lib/app-config";
import type { AppLocale } from "@/i18n/routing";

export function getSiteUrl() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function buildLocalizedUrl(locale: AppLocale, path = "") {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

/** Ensures Open Graph / Twitter image URLs are absolute when `APP_URL` is set. */
export function resolveOgImageUrl(image: string | null | undefined): string | undefined {
  const raw = image?.trim();
  if (!raw) {
    return undefined;
  }
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return raw;
  }
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return raw;
  }
  if (raw.startsWith("/")) {
    return `${siteUrl}${raw}`;
  }
  return `${siteUrl}/${raw}`;
}

export function buildAlternateLocales(
  locale: AppLocale,
  path = "",
): Metadata["alternates"] {
  const canonical = buildLocalizedUrl(locale, path);

  if (!canonical) {
    return undefined;
  }

  return {
    canonical,
    languages: Object.fromEntries(
      appConfig.locales.flatMap((entry) => {
        const localizedUrl = buildLocalizedUrl(entry, path);
        return localizedUrl ? [[entry, localizedUrl] as const] : [];
      }),
    ),
  };
}

export function buildOpenGraphMetadata(args: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  image?: string | null;
}): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = buildLocalizedUrl(args.locale, args.path);
  const ogImage = resolveOgImageUrl(args.image);

  return {
    alternates: buildAlternateLocales(args.locale, args.path),
    openGraph: {
      title: args.title,
      description: args.description,
      url: url ?? undefined,
      siteName: appConfig.name,
      locale: args.locale,
      type: args.type ?? "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: args.title,
      description: args.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
