import type { Metadata } from "next";

import { buildOpenGraphMetadata } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

export function buildLandingMetadata(args: {
  locale: AppLocale;
  title: string;
  description: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
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
  citySlug: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: `/cities/${args.citySlug}`,
      title: args.title,
      description: args.description,
    }),
  };
}
