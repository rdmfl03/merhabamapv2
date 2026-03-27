import type { AppLocale } from "@/i18n/routing";
import { appConfig } from "@/lib/app-config";
import { buildLocalizedUrl } from "@/lib/seo/site";

export function buildOrganizationSchema(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: appConfig.name,
    url: buildLocalizedUrl(locale),
    description: appConfig.description,
  };
}

export function buildCityCollectionSchema(args: {
  locale: AppLocale;
  cityName: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${args.cityName} | ${appConfig.name}`,
    description: args.description,
    url: buildLocalizedUrl(args.locale, args.path),
    inLanguage: args.locale,
  };
}

export function buildPlaceSchema(args: {
  locale: AppLocale;
  slug: string;
  name: string;
  description: string;
  cityName: string;
  addressLine1?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  image?: string | null;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: args.name,
    description: args.description,
    url: buildLocalizedUrl(args.locale, `/places/${args.slug}`),
    image: args.image ?? undefined,
    telephone: args.phone ?? undefined,
    sameAs: args.websiteUrl ?? undefined,
    aggregateRating:
      args.aggregateRating && args.aggregateRating.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: args.aggregateRating.ratingValue,
            reviewCount: args.aggregateRating.ratingCount,
            ratingCount: args.aggregateRating.ratingCount,
            bestRating: 5,
            worstRating: 0,
          }
        : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: args.addressLine1 ?? undefined,
      postalCode: args.postalCode ?? undefined,
      addressLocality: args.cityName,
      addressCountry: "DE",
    },
  };
}

export function buildEventSchema(args: {
  locale: AppLocale;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  cityName: string;
  venueName?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  externalUrl?: string | null;
  image?: string | null;
  organizerName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: args.title,
    description: args.description,
    startDate: args.startsAt,
    endDate: args.endsAt ?? undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: args.externalUrl ?? buildLocalizedUrl(args.locale, `/events/${args.slug}`),
    image: args.image ? [args.image] : undefined,
    organizer: args.organizerName
      ? {
          "@type": "Organization",
          name: args.organizerName,
        }
      : undefined,
    location: {
      "@type": "Place",
      name: args.venueName ?? args.cityName,
      address: {
        "@type": "PostalAddress",
        streetAddress: args.addressLine1 ?? undefined,
        postalCode: args.postalCode ?? undefined,
        addressLocality: args.cityName,
        addressCountry: "DE",
      },
    },
  };
}
