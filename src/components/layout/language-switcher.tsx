"use client";

import type { Route } from "next";
import { useLocale } from "next-intl";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLocalizedPath, LOCALE_COOKIE_NAME } from "@/i18n/locale";
import { type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeOptions = [
  { code: "de", label: "DE" },
  { code: "tr", label: "TR" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLocale = params?.locale === "tr" || params?.locale === "de" ? params.locale : locale;

  function switchLocale(nextLocale: AppLocale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const targetPath = buildLocalizedPath(nextLocale, pathname);
    const query = searchParams.toString();
    const href = (query ? `${targetPath}?${query}` : targetPath) as Route;
    router.replace(href);
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
