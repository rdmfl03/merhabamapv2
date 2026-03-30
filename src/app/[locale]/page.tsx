import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PublicCtaSection } from "@/components/marketing/public-cta-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PublicHero } from "@/components/marketing/public-hero";
import { TrustSection } from "@/components/marketing/trust-section";
import { JsonLd } from "@/components/seo/json-ld";
import { buildLandingMetadata } from "@/lib/metadata/public";
import { buildOrganizationSchema } from "@/lib/seo/structured-data";
import { getCurrentUserProfile } from "@/server/queries/user/get-current-user-profile";

type LandingPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return buildLandingMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  if (session?.user?.id && session.user.onboardingCompletedAt) {
    try {
      const profile = await getCurrentUserProfile(session.user.id);

      if (profile?.onboardingCity?.slug) {
        redirect(`/${locale}/map?city=${profile.onboardingCity.slug}`);
      }
    } catch {
      // Fall back to the public landing experience if auth-linked DB reads fail.
    }
  }

  const t = await getTranslations("landing");

  return (
    <div className="pb-10 sm:pb-12">
      <JsonLd data={buildOrganizationSchema(locale)} />

      <PublicHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("subtitle")}
        mapCta={t("heroMapCta")}
        trustTitle={t("heroTrust.title")}
        trustPoints={[
          t("heroTrust.curated"),
          t("heroTrust.cityFirst"),
          t("heroTrust.reportable"),
        ]}
        pillars={["places", "events", "map"].map((key) => ({
          eyebrow: t(`cards.${key}.eyebrow`),
          title: t(`cards.${key}.title`),
          description: t(`cards.${key}.description`),
        }))}
      />

      <HowItWorksSection
        eyebrow={t("howItWorks.eyebrow")}
        title={t("howItWorks.title")}
        description={t("howItWorks.description")}
        steps={["one", "two", "three"].map((stepKey, index) => ({
          step: String(index + 1),
          title: t(`howItWorks.steps.${stepKey}.title`),
          description: t(`howItWorks.steps.${stepKey}.description`),
        }))}
      />

      <TrustSection
        eyebrow={t("trust.eyebrow")}
        title={t("trust.title")}
        description={t("trust.description")}
        items={["quality", "reports", "claims"].map((key) => ({
          title: t(`trust.items.${key}.title`),
          description: t(`trust.items.${key}.description`),
        }))}
      />

      <PublicCtaSection
        eyebrow={t("cta.eyebrow")}
        title={t("cta.title")}
        description={t("cta.description")}
        primaryCta={t("cta.primary")}
        secondaryCta={t("cta.secondary")}
        tertiaryCta={t("cta.tertiary")}
      />
    </div>
  );
}
