import type { Metadata } from "next";

import { robotsIndexFollow } from "@/lib/seo/robots-meta";
import { buildOpenGraphMetadata } from "@/lib/seo/site";

export function buildPlacesListingMetadata(args: {
  title: string;
  description: string;
  locale: "de" | "tr";
  path?: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    robots: robotsIndexFollow,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: args.path ?? "/places",
      title: args.title,
      description: args.description,
    }),
  };
}

export function buildPlaceDetailMetadata(args: {
  title: string;
  description: string;
  locale: "de" | "tr";
  slug: string;
  image?: string | null;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    robots: robotsIndexFollow,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: `/places/${args.slug}`,
      title: args.title,
      description: args.description,
      type: "article",
      image: args.image,
    }),
  };
}
