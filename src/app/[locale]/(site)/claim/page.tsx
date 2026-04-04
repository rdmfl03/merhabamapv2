import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderState } from "@/components/ui/placeholder-state";

type ClaimPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("placeholders");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PlaceholderState
        eyebrow={t("claimsEyebrow")}
        title={t("claimsTitle")}
        description={t("claimsDescription")}
      />
    </div>
  );
}
