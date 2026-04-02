import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PublicCtaSection } from "@/components/marketing/public-cta-section";
import { PublicHero } from "@/components/marketing/public-hero";
import { TrustSection } from "@/components/marketing/trust-section";
import { JsonLd } from "@/components/seo/json-ld";
import { buildLandingMetadata } from "@/lib/metadata/public";
import { buildOrganizationSchema } from "@/lib/seo/structured-data";
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
    redirect(`/${locale}/home`);
  }

  const t = await getTranslations("landing");

  return (
    <div className="pb-10 sm:pb-12">
      <JsonLd data={buildOrganizationSchema(locale)} />

      <PublicHero
        eyebrow={t("eyebrow")}
        claim={t("claim")}
        title={t("title")}
        description={t("subtitle")}
        trustTitle={t("heroTrust.title")}
        trustPoints={[
          t("heroTrust.curated"),
          t("heroTrust.cityFirst"),
          t("heroTrust.reportable"),
        ]}
        pillars={[
          {
            eyebrow: t("cards.places.eyebrow"),
            title: t("cards.places.title"),
            description: t("cards.places.description"),
            ctaLabel: t("explorePlaces"),
            href: "/places",
          },
          {
            eyebrow: t("cards.events.eyebrow"),
            title: t("cards.events.title"),
            description: t("cards.events.description"),
            ctaLabel: t("browseEvents"),
            href: "/events",
          },
          {
            eyebrow: t("cards.map.eyebrow"),
            title: t("cards.map.title"),
            description: t("cards.map.description"),
            ctaLabel: t("openMap"),
            href: "/map",
          },
        ]}
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
        communityNote={t("cta.communityNote")}
        primaryCta={t("cta.primary")}
        secondaryCta={t("cta.secondary")}
        tertiaryCta={t("cta.tertiary")}
      />
    </div>
  );
}
