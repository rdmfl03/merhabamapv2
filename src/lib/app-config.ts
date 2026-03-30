import { routing } from "@/i18n/routing";
import { PILOT_CITY_SLUGS } from "@/lib/pilot-cities";

export const appConfig = {
  name: process.env.APP_NAME?.trim() || "MerhabaMap",
  description:
    "Bilingual discovery platform for Turkish places and events in Germany.",
  defaultLocale: routing.defaultLocale,
  locales: routing.locales,
  pilotCities: PILOT_CITY_SLUGS,
  brand: {
    primaryHex: "#E30A17",
  },
} as const;
