"use client";

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
  };
}

function navItemClass(active: boolean, mobile?: boolean): string {
  return cn(
    "rounded-full text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    mobile ? "shrink-0 whitespace-nowrap px-3 py-1.5" : "px-3 py-1.5",
    active
      ? "bg-brand/12 font-semibold text-brand shadow-sm shadow-brand/[0.12]"
      : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function HeaderPrimaryNavDesktop() {
  const { t, primaryNavAria, mapOn, placesOn, eventsOn } = usePrimaryNavState();

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label={primaryNavAria}
    >
      <Link href="/map" className={navItemClass(mapOn)} aria-current={mapOn ? "page" : undefined}>
        {t("cities")}
      </Link>
      <Link
        href="/places"
        className={navItemClass(placesOn)}
        aria-current={placesOn ? "page" : undefined}
      >
        {t("places")}
      </Link>
      <Link
        href="/events"
        className={navItemClass(eventsOn)}
        aria-current={eventsOn ? "page" : undefined}
      >
        {t("events")}
      </Link>
    </nav>
  );
}

export function HeaderPrimaryNavMobile() {
  const { t, primaryNavAria, mapOn, placesOn, eventsOn } = usePrimaryNavState();

  return (
    <nav
      className="mt-3 flex items-center gap-1 overflow-x-auto md:hidden"
      aria-label={primaryNavAria}
    >
      <Link href="/map" className={navItemClass(mapOn, true)} aria-current={mapOn ? "page" : undefined}>
        {t("cities")}
      </Link>
      <Link
        href="/places"
        className={navItemClass(placesOn, true)}
        aria-current={placesOn ? "page" : undefined}
      >
        {t("places")}
      </Link>
      <Link
        href="/events"
        className={navItemClass(eventsOn, true)}
        aria-current={eventsOn ? "page" : undefined}
      >
        {t("events")}
      </Link>
    </nav>
  );
}
