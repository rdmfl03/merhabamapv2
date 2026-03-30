import Image from "next/image";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom,0px)))] text-sm text-muted-foreground">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand shadow-sm ring-1 ring-black/10 md:ring-border/70">
              <Image
                src="/logo-pin.svg"
                alt="MerhabaMap logo"
                width={40}
                height={40}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">MerhabaMap</p>
              <p>{t("tagline")}</p>
            </div>
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
          aria-label={t("navAriaLabel")}
        >
          <Link href="/map">{common("cities")}</Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link href="/places">{common("places")}</Link>
          <Link href="/events">{common("events")}</Link>
          <Link href="/auth/signup">{common("signUp")}</Link>
        </nav>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/impressum">{legal("navigation.impressum")}</Link>
          <Link href="/privacy">{legal("navigation.privacy")}</Link>
          <Link href="/contact">{legal("navigation.contact")}</Link>
          <Link href="/cookies">{legal("navigation.cookies")}</Link>
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
