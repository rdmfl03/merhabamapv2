"use client";

import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const localeOptions = [
  { code: "de", label: "DE" },
  { code: "tr", label: "TR" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-full border border-border bg-white p-1">
      {localeOptions.map((option) => (
        <Link
          key={option.code}
          href={pathname}
          locale={option.code}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            locale === option.code
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
