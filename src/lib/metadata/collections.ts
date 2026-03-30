import type { Metadata } from "next";

import { buildOpenGraphMetadata } from "@/lib/seo/site";
import { robotsIndexFollow, robotsNoIndex } from "@/lib/seo/robots-meta";
import type { AppLocale } from "@/i18n/routing";

export function buildPublicCollectionDetailMetadata(args: {
  locale: AppLocale;
  collectionId: string;
  title: string;
  description: string;
  indexable: boolean;
}): Metadata {
  const path = `/collections/${args.collectionId}`;
  return {
    title: args.title,
    description: args.description,
    robots: args.indexable ? robotsIndexFollow : robotsNoIndex,
    ...buildOpenGraphMetadata({
      locale: args.locale,
      path,
      title: args.title,
      description: args.description,
      type: "article",
    }),
  };
}
