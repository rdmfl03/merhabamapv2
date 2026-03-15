import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderState } from "@/components/ui/placeholder-state";

type CategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("placeholders");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PlaceholderState
        eyebrow={slug}
        title={t("categoryTitle")}
        description={t("categoryDescription")}
      />
    </div>
  );
}
