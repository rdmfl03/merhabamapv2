import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "tr"],
  defaultLocale: "de",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return locale === "de" || locale === "tr";
}
