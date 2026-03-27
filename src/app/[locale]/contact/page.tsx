import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSection } from "@/components/legal/legal-section";
import { getContactContent } from "@/content/legal/content";
import { isAppLocale } from "@/i18n/routing";
import { buildLegalMetadata } from "@/lib/metadata/legal";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "legal" });

  return buildLegalMetadata({
    locale,
    path: "/contact",
    title: t("contact.metaTitle"),
    description: t("contact.metaDescription"),
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  const content = getContactContent(locale);

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
