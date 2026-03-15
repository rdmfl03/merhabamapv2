import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";

export const appConfig = {
  name: env.APP_NAME,
  description:
    "Bilingual discovery platform for Turkish places and events in Germany.",
  defaultLocale: routing.defaultLocale,
  locales: routing.locales,
  pilotCities: ["berlin", "koeln"] as const,
  brand: {
    primaryHex: "#E30A17",
  },
} as const;
