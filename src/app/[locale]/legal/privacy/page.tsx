import type { Route } from "next";
import { permanentRedirect } from "next/navigation";

import type { AppLocale } from "@/i18n/routing";

type LegalPrivacyLegacyRedirectProps = {
  params: Promise<{ locale: AppLocale }>;
};

/** Old URLs (e.g. /de/legal/privacy) → canonical privacy route. */
export default async function LegalPrivacyLegacyRedirect({
  params,
}: LegalPrivacyLegacyRedirectProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/privacy` as Route);
}
