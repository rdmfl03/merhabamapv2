import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderState } from "@/components/ui/placeholder-state";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PlaceholderState
        eyebrow={t("eyebrow")}
        title={t("verifyEmailTitle")}
        description={t("verifyEmailDescription")}
      />
    </div>
  );
}
