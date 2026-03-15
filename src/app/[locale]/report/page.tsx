import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderState } from "@/components/ui/placeholder-state";

type ReportPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("placeholders");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PlaceholderState
        eyebrow={t("reportsEyebrow")}
        title={t("reportsTitle")}
        description={t("reportsDescription")}
      />
    </div>
  );
}
