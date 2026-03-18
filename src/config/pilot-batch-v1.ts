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
  manualReviewNotes?: readonly string[];
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
  manualReviewNotes?: readonly string[];
};

export const PILOT_BATCH_V1 = {
  places: [
    {
      slug: "hasir-restaurant-kreuzberg-berlin",
      name: "Hasir Restaurant Kreuzberg",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Hasir official location page",
      sourceKind: "official_website",
      sourceUrl: "https://www.hasir.de/restaurants/",
      websiteUrl: "https://www.hasir.de/",
      addressLine1: "Adalberstraße 10",
      postalCode: "10999",
      descriptionDe:
        "Berliner Traditionsrestaurant von Hasir in Kreuzberg mit türkischen Grillspezialitäten, hausgemachten Mezze und Desserts.",
      descriptionTr:
        "Kreuzberg'de Hasir'in geleneksel restoranı; Türk ızgara çeşitleri, ev yapımı mezeler ve tatlılar sunar.",
    },
    {
      slug: "fes-turkish-bbq-berlin",
      name: "FES – Turkish BBQ",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "FES Turkish BBQ official page",
      sourceKind: "official_website",
      sourceUrl: "https://fes-turkishbbq.de/speisekarte/",
      websiteUrl: "https://fes-turkishbbq.de/",
      addressLine1: "Hasenheide 58",
      postalCode: "10967",
      descriptionDe:
        "Türkisches Restaurant in Berlin-Kreuzberg mit BBQ- und Grillfokus in der Hasenheide.",
      descriptionTr:
        "Berlin-Kreuzberg'de Hasenheide üzerinde barbekü ve ızgara odaklı Türk restoranı.",
    },
    {
      slug: "osmans-toechter-berlin",
      name: "Osmans Töchter",
      citySlug: "berlin",
      categorySlug: "restaurants",
      sourceLabel: "Osmans Töchter official site",
      sourceKind: "official_website",
      sourceUrl: "https://osmanstoechter.de/",
      websiteUrl: "https://osmanstoechter.de/",
      addressLine1: "Pappelallee 15",
      postalCode: "10437",
      descriptionDe:
        "Restaurant für moderne türkische Küche mit hausgemachten warmen und kalten Meze im Prenzlauer Berg.",
      descriptionTr:
        "Prenzlauer Berg'de ev yapımı sıcak ve soğuk mezeleriyle modern Türk mutfağı sunan restoran.",
    },
    {
      slug: "asmali-konak-deluxe-koeln",
      name: "Asmali Konak Deluxe",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "Asmali Konak Deluxe official site",
      sourceKind: "official_website",
      sourceUrl: "https://asmali-konak-deluxe.eatbu.com/?lang=de",
      websiteUrl: "https://asmali-konak-deluxe.eatbu.com/?lang=de",
      addressLine1: "Keupstraße 44-46",
      postalCode: "51063",
      descriptionDe:
        "Türkisches Restaurant auf der Keupstraße mit klassischem Restaurantbetrieb und eigener Reservierungsseite.",
      descriptionTr:
        "Keupstraße üzerinde, klasik restoran servisi ve kendi rezervasyon sayfası olan Türk restoranı.",
    },
    {
      slug: "kebapland-koeln",
      name: "Kebapland",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "koeln.de place page",
      sourceKind: "official_website",
      sourceUrl: "https://www.koeln.de/leben/ll/imbisse-und-fast-food-in-koeln/kebapland/",
      websiteUrl: null,
      addressLine1: "Venloer Straße 385",
      postalCode: "50825",
      descriptionDe:
        "Bekannter Kölner Grillimbiss in Ehrenfeld mit Holzkohlegrill, Adana-Kebap und Fleischgerichten zum schnellen Essen vor Ort.",
      descriptionTr:
        "Ehrenfeld'de kömür ızgarası, Adana kebap ve hızlı servis edilen et yemekleriyle bilinen Köln klasiği.",
      manualReviewNotes: [
        "No separate official website was safely confirmed in this review pass; koeln.de remains the traceable source page.",
      ],
    },
    {
      slug: "artistanbul-meze-koeln",
      name: "Artistanbul Meze",
      citySlug: "koeln",
      categorySlug: "restaurants",
      sourceLabel: "ArtIstanbul official site",
      sourceKind: "official_website",
      sourceUrl: "https://artistanbul-restaurant.de/",
      websiteUrl: "https://artistanbul-restaurant.de/",
      addressLine1: "Komödienstraße 52",
      postalCode: "50667",
      descriptionDe:
        "Türkisches Restaurant in der Kölner Innenstadt mit Schwerpunkt auf türkischen Meze und aktueller Rückkehr an die Komödienstraße.",
      descriptionTr:
        "Köln merkezinde, Türk mezelerine odaklanan ve Komödienstraße adresine geri dönen Türk restoranı.",
    },
  ] satisfies readonly PilotPlaceRecord[],
  events: [
    {
      slug: "engin-sag-mir-almanya-tour-koeln",
      title: "Engin – Sag Mir Almanya Tour",
      citySlug: "koeln",
      category: "CULTURE",
      venueName: "Die Kantine",
      startsAt: "2026-05-29T20:00:00+02:00",
      endsAt: null,
      organizerName: null,
      sourceLabel: "koeln.de event page",
      sourceKind: "official_event_page",
      sourceUrl: "https://www.koeln.de/event/engin-sag-mir-almanya-tour-2026/",
      externalUrl: "https://www.koeln.de/event/engin-sag-mir-almanya-tour-2026/",
      addressLine1: "Neusser Landstr. 2",
      postalCode: "50735",
      descriptionDe:
        "Bühnentermin von Engins 'Sag Mir Almanya Tour 2026' am 29. Mai 2026 in der Kantine in Köln.",
      descriptionTr:
        "Engin'in 'Sag Mir Almanya Tour 2026' gösterisi 29 Mayıs 2026'da Köln'deki Die Kantine'de yapılır.",
    },
  ] satisfies readonly PilotEventRecord[],
} as const;
