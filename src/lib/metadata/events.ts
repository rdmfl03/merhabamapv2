import type { Metadata } from "next";

import { buildOpenGraphMetadata } from "@/lib/seo/site";

export function buildEventsListingMetadata(args: {
  title: string;
  description: string;
  locale: "de" | "tr";
  path?: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: args.path ?? "/events",
      title: args.title,
      description: args.description,
    }),
  };
}

export function buildEventDetailMetadata(args: {
  title: string;
  description: string;
  locale: "de" | "tr";
  slug: string;
  image?: string | null;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path: `/events/${args.slug}`,
      title: args.title,
      description: args.description,
      type: "article",
      image: args.image,
    }),
  };
}
