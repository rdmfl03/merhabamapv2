"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

import { buildLocalizedPath, LOCALE_COOKIE_NAME } from "@/i18n/locale";
import { type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeOptions = [
  { code: "de", label: "DE" },
  { code: "tr", label: "TR" },
] as const;

/**
 * Full browser navigation (not App Router `router.replace`): with `typedRoutes: true`, client-side
 * `replace()` can ignore or reject many hrefs (dynamic segments, query), so the locale never changed.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const params = useParams<{ locale?: string }>();
  const activeLocale = params?.locale === "tr" || params?.locale === "de" ? params.locale : locale;

  function switchLocale(nextLocale: AppLocale) {
    if (typeof window === "undefined") return;

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const targetPath = buildLocalizedPath(nextLocale, window.location.pathname);
    const search = window.location.search;
    const hash = window.location.hash;

    window.location.assign(`${targetPath}${search}${hash}`);
  }

  return (
    <div className="inline-flex rounded-full border border-border bg-white p-1">
      {localeOptions.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => switchLocale(option.code)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            activeLocale === option.code
              ? "bg-brand text-brand-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
