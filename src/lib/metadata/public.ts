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
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: args.path,
      title: args.title,
      description: args.description,
    }),
  };
}
