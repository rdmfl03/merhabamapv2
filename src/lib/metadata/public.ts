import type { Metadata } from "next";

import { robotsIndexFollow } from "@/lib/seo/robots-meta";
import { buildOpenGraphMetadata } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

export function buildLandingMetadata(args: {
  locale: AppLocale;
  title: string;
  description: string;
}): Metadata {
  return {
    title: {
      absolute: args.title,
    },
    description: args.description,
    robots: robotsIndexFollow,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: "",
      title: args.title,
      description: args.description,
    }),
  };
}

export function buildCityMetadata(args: {
  locale: AppLocale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    robots: robotsIndexFollow,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: args.path,
      title: args.title,
      description: args.description,
    }),
  };
}

/** Public taxonomy browse (place categories); same shape as city browse metadata. */
export function buildCategoryBrowseMetadata(args: {
  locale: AppLocale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  return buildCityMetadata(args);
}
