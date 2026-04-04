import type { Route } from "next";
import { permanentRedirect } from "next/navigation";

import type { AppLocale } from "@/i18n/routing";

type LegalImprintLegacyRedirectProps = {
  params: Promise<{ locale: AppLocale }>;
};

/** Old URLs (e.g. /de/legal/imprint) → canonical impressum route. */
export default async function LegalImprintLegacyRedirect({
  params,
}: LegalImprintLegacyRedirectProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/impressum` as Route);
}
