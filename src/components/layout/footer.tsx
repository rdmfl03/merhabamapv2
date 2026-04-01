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
    <footer className="border-t border-border bg-[linear-gradient(180deg,#ffffff_0%,#fafbfc_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom,0px)))] text-sm text-muted-foreground sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand shadow-sm ring-1 ring-black/10 md:ring-border/70">
                <Image
                  src="/logo-pin.svg"
                  alt="MerhabaMap logo"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-foreground">MerhabaMap</p>
                <p className="text-sm font-medium text-foreground/78">
                  {common("taglineShort")}
                </p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="max-w-2xl text-xs leading-6 text-muted-foreground">
              {t("essentialNotice")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                {t("navAriaLabel")}
              </p>
              <nav className="flex flex-col gap-2.5 text-sm" aria-label={t("navAriaLabel")}>
                <Link href="/map">{common("cities")}</Link>
                <Link href="/places">{common("places")}</Link>
                <Link href="/events">{common("events")}</Link>
                <Link href="/auth/signup">{common("signUp")}</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                {legal("eyebrow")}
              </p>
              <div className="grid gap-2.5 text-sm">
                <Link href="/impressum">{legal("navigation.impressum")}</Link>
                <Link href="/privacy">{legal("navigation.privacy")}</Link>
                <Link href="/contact">{legal("navigation.contact")}</Link>
                <Link href="/cookies">{legal("navigation.cookies")}</Link>
                <Link href="/terms">{legal("navigation.terms")}</Link>
                <Link href="/community-rules">{legal("navigation.communityRules")}</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/70 pt-4">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
