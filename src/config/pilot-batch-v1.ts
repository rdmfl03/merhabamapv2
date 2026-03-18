export const SEEDED_PUBLIC_PLACE_SLUGS = [
  "ankara-reisebuero-berlin",
  "firin-7-berlin",
  "lale-cafe-berlin",
  "nar-lokantasi-berlin",
  "hilal-service-point-koeln",
  "mavi-baris-camii-koeln",
  "selamet-market-koeln",
  "usta-berber-koeln",
] as const;

export const SEEDED_PUBLIC_EVENT_SLUGS = [
  "community-iftar-berlin",
  "student-meetup-berlin",
  "anatolia-late-session-berlin",
  "past-kulturabend-koeln",
  "kultur-brunch-koeln",
  "business-breakfast-koeln",
] as const;

export type PilotPlaceRecord = {
  slug: string;
  name: string;
  citySlug: "berlin" | "koeln";
  categorySlug: "restaurants";
  sourceLabel: string;
  sourceKind: "trusted_manual_submission" | "official_website" | "official_venue_website";
  sourceUrl: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  descriptionDe: string | null;
  descriptionTr: string | null;
};

export type PilotEventRecord = {
  slug: string;
  title: string;
  citySlug: "berlin" | "koeln";
  category: "CONCERT" | "CULTURE";
  venueName: string;
  startsAt: string;
  endsAt: string | null;
  organizerName: string | null;
  sourceLabel: string;
  sourceKind: "official_event_page" | "trusted_manual_submission";
  sourceUrl: string | null;
  externalUrl: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  descriptionDe: string | null;
  descriptionTr: string | null;
};

export const PILOT_BATCH_V1 = {
  places: [
    {
      slug: "hasir-restaurant-kreuzberg-berlin",
      name: "Hasir Restaurant Kreuzberg",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "fes-turkish-bbq-berlin",
      name: "FES – Turkish BBQ",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "mercan-restaurant-berlin",
      name: "Mercan Restaurant",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "osmans-toechter-berlin",
      name: "Osmans Töchter",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "asmali-konak-deluxe-koeln",
      name: "Asmali Konak Deluxe",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "kebapland-koeln",
      name: "Kebapland",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "artistanbul-meze-koeln",
      name: "Artistanbul Meze",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "Operator-curated pilot record",
      sourceKind: "trusted_manual_submission",
      sourceUrl: null,
      websiteUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
  ] satisfies readonly PilotPlaceRecord[],
  events: [
    {
      slug: "gueldur-gueldur-show-live-2026-berlin",
      title: "Güldür Güldür Show – Live 2026",
      citySlug: "berlin",
      category: "CULTURE",
      venueName: "Tempodrom",
      startsAt: "2026-05-29T20:00:00+02:00",
      endsAt: null,
      organizerName: null,
      sourceLabel: "Eventim",
      sourceKind: "official_event_page",
      sourceUrl: null,
      externalUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "altin-gun-live-2026-berlin",
      title: "Altın Gün – Live 2026",
      citySlug: "berlin",
      category: "CONCERT",
      venueName: "Columbiahalle",
      startsAt: "2026-06-12T20:00:00+02:00",
      endsAt: null,
      organizerName: null,
      sourceLabel: "Columbiahalle official page",
      sourceKind: "official_event_page",
      sourceUrl: null,
      externalUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "engin-sag-mir-almanya-tour-koeln",
      title: "Engin – Sag Mir Almanya Tour",
      citySlug: "koeln",
      category: "CULTURE",
      venueName: "Die Kantine",
      startsAt: "2026-05-29T20:00:00+02:00",
      endsAt: null,
      organizerName: null,
      sourceLabel: "Die Kantine official page",
      sourceKind: "official_event_page",
      sourceUrl: null,
      externalUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
    {
      slug: "mudi-alles-nasip-tour-2026-koeln",
      title: "Mudi – Alles Nasip Tour 2026",
      citySlug: "koeln",
      category: "CULTURE",
      venueName: "Palladium",
      startsAt: "2026-09-05T20:00:00+02:00",
      endsAt: null,
      organizerName: null,
      sourceLabel: "Eventim",
      sourceKind: "official_event_page",
      sourceUrl: null,
      externalUrl: null,
      addressLine1: null,
      postalCode: null,
      descriptionDe: null,
      descriptionTr: null,
    },
  ] satisfies readonly PilotEventRecord[],
} as const;
