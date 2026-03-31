"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isAppLocale } from "@/i18n/routing";

/**
 * Kompakte Kopfzeilen-Suche: Lupe öffnet das Feld.
 * Desktop: `flex-row-reverse` — das Feld wächst von der Lupe aus nach links.
 */
export function HeaderSearch() {
  const localeRaw = useLocale();
  const locale = isAppLocale(localeRaw) ? localeRaw : "de";
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="flex shrink-0 items-center">
      <form
        method="get"
        action={`/${locale}/search`}
        role="search"
        className={cn("flex items-center gap-1.5", "md:flex-row-reverse")}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 md:h-10 md:w-10"
          aria-expanded={open}
          aria-controls="header-search-q"
          aria-label={open ? t("headerToggleClose") : t("headerToggleOpen")}
          onClick={() => setOpen((v) => !v)}
        >
          <Search className="h-4 w-4" aria-hidden />
        </Button>

        <div
          className={cn(
            "overflow-hidden transition-[max-width] duration-200 ease-out",
            open
              ? "max-w-[min(18rem,calc(100vw-14rem))] max-md:max-w-[min(16rem,calc(100vw-9rem))]"
              : "max-w-0",
          )}
          aria-hidden={!open}
        >
          <div className="flex min-w-0 items-center md:justify-end">
            <label htmlFor="header-search-q" className="sr-only">
              {t("headerLabel")}
            </label>
            <input
              ref={inputRef}
              id="header-search-q"
              name="q"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder={t("headerPlaceholder")}
              tabIndex={open ? 0 : -1}
              className={cn(
                "h-9 w-full min-w-[10.5rem] rounded-full border-2 border-brand/45 bg-background px-3 text-sm text-foreground shadow-sm outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground",
                "focus-visible:border-brand focus-visible:ring-0",
                "max-md:min-w-[min(10.5rem,calc(100vw-7.5rem))] md:min-w-[14rem]",
              )}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
