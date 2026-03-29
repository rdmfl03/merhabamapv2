import type { PrismaClient } from "@prisma/client";

export const PLACE_CATEGORY_SEED_ROWS = [
  { slug: "restaurants", nameDe: "Restaurants", nameTr: "Restoranlar", icon: "utensils", sortOrder: 10 },
  { slug: "cafes", nameDe: "Cafés", nameTr: "Kafeler", icon: "coffee", sortOrder: 20 },
  { slug: "bakeries", nameDe: "Bäckereien", nameTr: "Fırınlar", icon: "bread", sortOrder: 30 },
  { slug: "markets", nameDe: "Supermärkte", nameTr: "Marketler", icon: "shopping-basket", sortOrder: 40 },
  { slug: "mosques", nameDe: "Moscheen", nameTr: "Camiler", icon: "landmark", sortOrder: 50 },
  { slug: "barbers", nameDe: "Barbiere", nameTr: "Berberler", icon: "scissors", sortOrder: 60 },
  { slug: "travel-agencies", nameDe: "Reisebüros", nameTr: "Seyahat acenteleri", icon: "plane", sortOrder: 70 },
  { slug: "services", nameDe: "Dienstleistungen", nameTr: "Hizmetler", icon: "briefcase", sortOrder: 80 },
  { slug: "gastronomy", nameDe: "Gastronomie", nameTr: "Gastronomi", icon: "utensils", sortOrder: 90 },
  {
    slug: "cafes-teahouses",
    nameDe: "Cafés & Teestuben",
    nameTr: "Kahve ve çay evleri",
    icon: "coffee",
    sortOrder: 100,
  },
  { slug: "retail", nameDe: "Einzelhandel", nameTr: "Perakende", icon: "store", sortOrder: 110 },
  {
    slug: "religious-sites",
    nameDe: "Religiöse Orte",
    nameTr: "Dini mekanlar",
    icon: "landmark",
    sortOrder: 120,
  },
  {
    slug: "cultural-centers",
    nameDe: "Kulturzentren",
    nameTr: "Kültür merkezleri",
    icon: "theater",
    sortOrder: 130,
  },
  {
    slug: "associations",
    nameDe: "Vereine & Verbände",
    nameTr: "Dernekler",
    icon: "users",
    sortOrder: 140,
  },
  {
    slug: "sports-leisure",
    nameDe: "Sport & Freizeit",
    nameTr: "Spor ve boş zaman",
    icon: "dumbbell",
    sortOrder: 150,
  },
  {
    slug: "event-venues",
    nameDe: "Veranstaltungsorte",
    nameTr: "Etkinlik mekanları",
    icon: "calendar",
    sortOrder: 160,
  },
  { slug: "nightlife", nameDe: "Nachtleben", nameTr: "Gece hayatı", icon: "moon", sortOrder: 170 },
  {
    slug: "education-language",
    nameDe: "Bildung & Sprache",
    nameTr: "Eğitim ve dil",
    icon: "book-open",
    sortOrder: 180,
  },
  { slug: "health", nameDe: "Gesundheit", nameTr: "Sağlık", icon: "heart-pulse", sortOrder: 190 },
  { slug: "advisory", nameDe: "Beratung", nameTr: "Danışmanlık", icon: "messages-square", sortOrder: 200 },
  { slug: "catering", nameDe: "Catering", nameTr: "Catering", icon: "chef-hat", sortOrder: 210 },
  {
    slug: "childcare",
    nameDe: "Kinderbetreuung",
    nameTr: "Çocuk bakımı",
    icon: "baby",
    sortOrder: 220,
  },
] as const;

export type PlaceCategorySlug = (typeof PLACE_CATEGORY_SEED_ROWS)[number]["slug"];

const SLUG_SET = new Set<string>(PLACE_CATEGORY_SEED_ROWS.map((row) => row.slug));

export function isKnownPlaceCategorySlug(slug: string): slug is PlaceCategorySlug {
  return SLUG_SET.has(slug);
}

export async function upsertAllPlaceCategories(prisma: PrismaClient) {
  for (const row of PLACE_CATEGORY_SEED_ROWS) {
    await prisma.placeCategory.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        nameDe: row.nameDe,
        nameTr: row.nameTr,
        icon: row.icon,
        sortOrder: row.sortOrder,
      },
      update: {
        nameDe: row.nameDe,
        nameTr: row.nameTr,
        icon: row.icon,
        sortOrder: row.sortOrder,
      },
    });
  }

  const stored = await prisma.placeCategory.findMany();
  return Object.fromEntries(stored.map((category) => [category.slug, category]));
}
