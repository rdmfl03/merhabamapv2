import type { Metadata } from "next";

import { appConfig } from "@/lib/app-config";
import { env } from "@/lib/env";
import type { AppLocale } from "@/i18n/routing";

export function getSiteUrl() {
  return env.APP_URL;
}

export function buildLocalizedUrl(locale: AppLocale, path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function buildAlternateLocales(
  locale: AppLocale,
  path = "",
): Metadata["alternates"] {
  return {
    canonical: buildLocalizedUrl(locale, path),
    languages: Object.fromEntries(
      appConfig.locales.map((locale) => [locale, buildLocalizedUrl(locale, path)]),
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

  return {
    alternates: buildAlternateLocales(args.locale, args.path),
    openGraph: {
      title: args.title,
      description: args.description,
      url,
      siteName: appConfig.name,
      locale: args.locale,
      type: args.type ?? "website",
      images: args.image ? [{ url: args.image }] : undefined,
    },
    twitter: {
      card: args.image ? "summary_large_image" : "summary",
      title: args.title,
      description: args.description,
      images: args.image ? [args.image] : undefined,
    },
  };
}
