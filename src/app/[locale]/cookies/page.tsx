import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSection } from "@/components/legal/legal-section";
import { getCookiesContent } from "@/content/legal/content";
import { isAppLocale } from "@/i18n/routing";
import { buildLegalMetadata } from "@/lib/metadata/legal";

type CookiesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CookiesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "legal" });

  return buildLegalMetadata({
    locale,
    path: "/cookies",
    title: t("cookies.metaTitle"),
    description: t("cookies.metaDescription"),
  });
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  const content = getCookiesContent(locale);

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
