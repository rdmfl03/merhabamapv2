import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function Footer() {
  const [t, common, legal] = await Promise.all([
    getTranslations("footer"),
    getTranslations("common"),
    getTranslations("legal"),
  ]);

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">MerhabaMap</p>
          <p>{t("tagline")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/places">{common("places")}</Link>
          <Link href="/events">{common("events")}</Link>
          <Link href="/cities/berlin">{t("berlin")}</Link>
          <Link href="/cities/koeln">{t("koeln")}</Link>
          <Link href="/auth/signup">{common("signUp")}</Link>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/impressum">{legal("navigation.impressum")}</Link>
          <Link href="/privacy">{legal("navigation.privacy")}</Link>
          <Link href="/terms">{legal("navigation.terms")}</Link>
          <Link href="/community-rules">{legal("navigation.communityRules")}</Link>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          {t("essentialNotice")}
        </p>
        <p>{t("copyright")}</p>
      </div>
    </footer>
  );
}
