import type { Metadata } from "next";

import type { AppLocale } from "@/i18n/routing";
import { buildOpenGraphMetadata } from "@/lib/seo/site";

export function buildLegalMetadata(args: {
  locale: AppLocale;
  path: "/impressum" | "/privacy" | "/terms" | "/community-rules" | "/contact" | "/cookies";
  title: string;
  description: string;
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
