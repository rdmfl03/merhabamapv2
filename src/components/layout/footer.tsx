import Image from "next/image";

import { Link } from "@/i18n/navigation";

type FooterProps = {
  tagline: string;
  navAriaLabel: string;
  essentialNotice: string;
  copyright: string;
  citiesLabel: string;
  placesLabel: string;
  eventsLabel: string;
  signUpLabel: string;
  impressumLabel: string;
  privacyLabel: string;
  contactLabel: string;
  cookiesLabel: string;
  termsLabel: string;
  communityRulesLabel: string;
};

export function Footer({
  tagline,
  navAriaLabel,
  essentialNotice,
  copyright,
  citiesLabel,
  placesLabel,
  eventsLabel,
  signUpLabel,
  impressumLabel,
  privacyLabel,
  contactLabel,
  cookiesLabel,
  termsLabel,
  communityRulesLabel,
}: FooterProps) {
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
                <p className="text-sm font-medium text-foreground/78">{tagline}</p>
              </div>
            </div>
            <p className="max-w-2xl text-xs leading-6 text-muted-foreground">
              {essentialNotice}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                {navAriaLabel}
              </p>
              <nav className="flex flex-col gap-2.5 text-sm" aria-label={navAriaLabel}>
                <Link href="/map">{citiesLabel}</Link>
                <Link href="/places">{placesLabel}</Link>
                <Link href="/events">{eventsLabel}</Link>
                <Link href="/auth/signup">{signUpLabel}</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                Rechtliches
              </p>
              <div className="grid gap-2.5 text-sm">
                <Link href="/impressum">{impressumLabel}</Link>
                <Link href="/privacy">{privacyLabel}</Link>
                <Link href="/contact">{contactLabel}</Link>
                <Link href="/cookies">{cookiesLabel}</Link>
                <Link href="/terms">{termsLabel}</Link>
                <Link href="/community-rules">{communityRulesLabel}</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/70 pt-4">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
