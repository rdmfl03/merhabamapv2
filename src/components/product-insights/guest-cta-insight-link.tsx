"use client";

import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { recordClientProductInsight } from "@/server/actions/product-insights/record-client-product-insight";

type GuestCtaInsightLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  locale: AppLocale;
  /** Low-cardinality origin, e.g. `place_save`, `guest_conversion_hint`. */
  surface: string;
  ctaType: "signin" | "signup";
  onClick?: ComponentProps<typeof Link>["onClick"];
};

export function GuestCtaInsightLink({
  locale,
  surface,
  ctaType,
  onClick,
  href,
  ...rest
}: GuestCtaInsightLinkProps) {
  const name =
    ctaType === "signin" ? "guest_signin_cta_click" : "guest_signup_cta_click";

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        void recordClientProductInsight({ name, locale, surface });
        onClick?.(e);
      }}
    />
  );
}
