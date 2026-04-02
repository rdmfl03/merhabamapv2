"use client";

import type { ReactNode } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Used when `messages.*.json` is missing `common.primaryNavAria` (e.g. stale cache / old deploy). */
const PRIMARY_NAV_ARIA_FALLBACK: Record<string, string> = {
  de: "Hauptnavigation",
  tr: "Ana gezinme",
};

function usePrimaryNavAriaLabel(): string {
  const locale = useLocale();
  const messages = useMessages();
  const common = messages.common;
  if (common && typeof common === "object" && !Array.isArray(common)) {
    const value = (common as Record<string, unknown>).primaryNavAria;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return PRIMARY_NAV_ARIA_FALLBACK[locale] ?? PRIMARY_NAV_ARIA_FALLBACK.de;
}

function isMapActive(path: string): boolean {
  return path === "/map" || path.startsWith("/map/") || path === "/cities/map";
}

function isPlacesActive(path: string): boolean {
  return path === "/places" || path.startsWith("/places/");
}

function isEventsActive(path: string): boolean {
  return path === "/events" || path.startsWith("/events/");
}

function isFeedActive(path: string): boolean {
  return path === "/feed";
}

function usePrimaryNavState() {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("common");
  const primaryNavAria = usePrimaryNavAriaLabel();

  return {
    t,
    primaryNavAria,
    mapOn: isMapActive(pathname),
    placesOn: isPlacesActive(pathname),
    eventsOn: isEventsActive(pathname),
    feedOn: isFeedActive(pathname),
  };
}

function PrimaryNavLink({
  href,
  active,
  children,
  mobile,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        mobile ? "min-h-8 px-2.5 py-1.5 text-xs" : "min-h-9 px-4 py-2 text-sm sm:px-4.5",
        "rounded-full tracking-[0.01em]",
        active
          ? "bg-background font-semibold text-brand shadow-[0_8px_18px_-12px_rgba(15,23,42,0.22)] ring-1 ring-border/80"
          : "font-medium text-foreground/72 hover:bg-background/88 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

const navShellClass = cn(
  "items-center gap-1 rounded-full border border-border/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.92)_100%)] p-1 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.2)] backdrop-blur-sm",
  "ring-1 ring-black/[0.05]",
);

export function HeaderPrimaryNavDesktop({
  showFeed = true,
}: {
  showFeed?: boolean;
} = {}) {
  const { t, primaryNavAria, mapOn, placesOn, eventsOn, feedOn } = usePrimaryNavState();

  return (
    <nav className={cn("hidden md:flex", navShellClass)} aria-label={primaryNavAria}>
      <PrimaryNavLink href="/places" active={placesOn}>
        {t("places")}
      </PrimaryNavLink>
      <PrimaryNavLink href="/events" active={eventsOn}>
        {t("events")}
      </PrimaryNavLink>
      <PrimaryNavLink href="/map" active={mapOn}>
        {t("cities")}
      </PrimaryNavLink>
      {showFeed ? (
        <PrimaryNavLink href="/feed" active={feedOn}>
          {t("feed")}
        </PrimaryNavLink>
      ) : null}
    </nav>
  );
}

export function HeaderPrimaryNavMobile({
  className,
  showFeed = true,
}: {
  className?: string;
  showFeed?: boolean;
}) {
  const { t, primaryNavAria, mapOn, placesOn, eventsOn, feedOn } = usePrimaryNavState();

  return (
    <nav
      className={cn(
        navShellClass,
        "flex max-w-full flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden",
        className,
      )}
      aria-label={primaryNavAria}
    >
      <PrimaryNavLink href="/places" active={placesOn} mobile>
        {t("places")}
      </PrimaryNavLink>
      <PrimaryNavLink href="/events" active={eventsOn} mobile>
        {t("events")}
      </PrimaryNavLink>
      <PrimaryNavLink href="/map" active={mapOn} mobile>
        {t("cities")}
      </PrimaryNavLink>
      {showFeed ? (
        <PrimaryNavLink href="/feed" active={feedOn} mobile>
          {t("feed")}
        </PrimaryNavLink>
      ) : null}
    </nav>
  );
}
