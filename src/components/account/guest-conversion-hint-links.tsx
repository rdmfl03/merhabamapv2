"use client";

import { GuestCtaInsightLink } from "@/components/product-insights/guest-cta-insight-link";
import type { AppLocale } from "@/i18n/routing";

type GuestConversionHintLinksProps = {
  locale: AppLocale;
  signInHref: string;
  signUpHref: string;
  signInLabel: string;
  signUpLabel: string;
};

export function GuestConversionHintLinks({
  locale,
  signInHref,
  signUpHref,
  signInLabel,
  signUpLabel,
}: GuestConversionHintLinksProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <GuestCtaInsightLink
        href={signInHref}
        locale={locale}
        surface="guest_conversion_hint"
        ctaType="signin"
        className="text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        {signInLabel}
      </GuestCtaInsightLink>
      <span className="text-xs text-muted-foreground" aria-hidden>
        ·
      </span>
      <GuestCtaInsightLink
        href={signUpHref}
        locale={locale}
        surface="guest_conversion_hint"
        ctaType="signup"
        className="text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        {signUpLabel}
      </GuestCtaInsightLink>
    </div>
  );
}
