import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

type NotFoundProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function UserProfileNotFound({ params }: NotFoundProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("userProfile");

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="font-display text-2xl text-foreground">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFoundBody")}</p>
      <Link href="/map" className="inline-block text-sm font-semibold text-brand hover:underline">
        ← MerhabaMap
      </Link>
    </div>
  );
}
