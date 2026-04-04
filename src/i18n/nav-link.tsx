"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { useProfileNavLocale } from "@/components/i18n/profile-nav-locale-context";

import { IntlLink } from "./navigation-core";

type IntlLinkProps = ComponentPropsWithoutRef<typeof IntlLink>;

/**
 * Same as next-intl `Link`, but for signed-in users forces `locale` to {@link ProfileNavLocaleProvider}
 * so leaving a “preview” locale (toggle) returns navigation to the profile language.
 */
export const NavLink = forwardRef<HTMLAnchorElement, IntlLinkProps>(function NavLink(
  props,
  ref,
) {
  const profileLocale = useProfileNavLocale();
  return (
    <IntlLink
      ref={ref}
      {...props}
      {...(profileLocale ? { locale: profileLocale } : {})}
    />
  );
});
