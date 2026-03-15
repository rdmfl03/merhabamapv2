import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSection } from "@/components/legal/legal-section";
import { getImpressumContent } from "@/content/legal/content";
import { isAppLocale } from "@/i18n/routing";
import { buildLegalMetadata } from "@/lib/metadata/legal";

type ImpressumPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ImpressumPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "legal" });

  return buildLegalMetadata({
    locale,
    path: "/impressum",
    title: t("impressum.metaTitle"),
    description: t("impressum.metaDescription"),
  });
}

export default async function ImpressumPage({ params }: ImpressumPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  const content = getImpressumContent(locale);

  return (
    <LegalPageShell
      eyebrow={t("eyebrow")}
      title={content.title}
      intro={content.intro}
      notice={t("draftNotice")}
    >
      {content.sections.map((section) => (
        <LegalSection key={section.title} section={section} />
      ))}
    </LegalPageShell>
  );
}
