import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSection } from "@/components/legal/legal-section";
import { getTermsContent } from "@/content/legal/content";
import { isAppLocale } from "@/i18n/routing";
import { buildLegalMetadata } from "@/lib/metadata/legal";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "legal" });

  return buildLegalMetadata({
    locale,
    path: "/terms",
    title: t("terms.metaTitle"),
    description: t("terms.metaDescription"),
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  const content = getTermsContent(locale);

  return (
    <LegalPageShell eyebrow={t("eyebrow")} title={content.title} intro={content.intro}>
      {content.sections.map((section) => (
        <LegalSection key={section.title} section={section} />
      ))}
    </LegalPageShell>
  );
}
