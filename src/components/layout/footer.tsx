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
              <p>{tagline}</p>
            </div>
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
          aria-label={navAriaLabel}
        >
          <Link href="/map">{citiesLabel}</Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link href="/places">{placesLabel}</Link>
          <Link href="/events">{eventsLabel}</Link>
          <Link href="/auth/signup">{signUpLabel}</Link>
        </nav>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/impressum">{impressumLabel}</Link>
          <Link href="/privacy">{privacyLabel}</Link>
          <Link href="/contact">{contactLabel}</Link>
          <Link href="/cookies">{cookiesLabel}</Link>
          <Link href="/terms">{termsLabel}</Link>
          <Link href="/community-rules">{communityRulesLabel}</Link>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          {essentialNotice}
        </p>
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
