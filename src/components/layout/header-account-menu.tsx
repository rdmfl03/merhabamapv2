"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { signOutFromApp } from "@/server/actions/auth/sign-out-action";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

type HeaderAccountMenuProps = {
  locale: AppLocale;
  username: string | null;
};

const menuItemClass =
  "block w-full rounded-xl px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-brand/35";

export function HeaderAccountMenu({ locale, username }: HeaderAccountMenuProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trimmed = username?.trim() ?? "";
  const hasPublicProfile = trimmed.length > 0;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-10"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={t("accountMenuTitle")}
        aria-label={t("accountMenuAria")}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings className="h-[1.15rem] w-[1.15rem]" aria-hidden />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("accountMenuAria")}
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 min-w-[13.5rem] rounded-2xl border border-border/80 bg-background py-1 shadow-md",
          )}
        >
          {hasPublicProfile ? (
            <Link
              href={`/user/${encodeURIComponent(trimmed)}`}
              role="menuitem"
              className={menuItemClass}
              onClick={close}
            >
              {t("menuPublicProfile")}
            </Link>
          ) : (
            <Link href="/profile" role="menuitem" className={menuItemClass} onClick={close}>
              {t("menuPublicProfileSetup")}
            </Link>
          )}
          <Link href="/profile" role="menuitem" className={menuItemClass} onClick={close}>
            {t("menuSettings")}
          </Link>

          <div className="my-1 h-px bg-border/70" role="separator" />

          <Link href="/collections" role="menuitem" className={menuItemClass} onClick={close}>
            {t("menuCollections")}
          </Link>
          <Link href="/saved/places" role="menuitem" className={menuItemClass} onClick={close}>
            {t("menuSavedPlaces")}
          </Link>
          <Link href="/saved/events" role="menuitem" className={menuItemClass} onClick={close}>
            {t("menuSavedEvents")}
          </Link>

          <div className="my-1 h-px bg-border/70" role="separator" />

          <form action={signOutFromApp}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" role="menuitem" className={cn(menuItemClass, "text-destructive hover:text-destructive")}>
              {t("menuSignOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
