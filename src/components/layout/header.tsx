import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import {
  HeaderPrimaryNavDesktop,
  HeaderPrimaryNavMobile,
} from "@/components/layout/header-primary-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { canAccessBusiness } from "@/lib/permissions";

export async function Header() {
  const t = await getTranslations("common");
  let session = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur pt-[max(0px,env(safe-area-inset-top,0px))]">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-start justify-between gap-3 md:contents">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand shadow-sm ring-1 ring-black/10 sm:h-10 sm:w-10 md:ring-border/70">
                <Image
                  src="/logo-pin.svg"
                  alt="MerhabaMap logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover object-center"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground sm:text-lg">{t("brandName")}</p>
                <p className="line-clamp-2 text-[11px] font-medium leading-snug tracking-[0.02em] text-muted-foreground sm:text-xs">
                  {t("taglineShort")}
                </p>
              </div>
            </Link>
            <div className="shrink-0 pt-0.5 md:hidden">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 md:w-auto md:flex-nowrap md:gap-3">
            <HeaderPrimaryNavDesktop />
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {session?.user ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                {canAccessBusiness(session.user.role) ? (
                  <Button variant="outline" size="sm" className="md:h-10 md:px-4 md:text-sm" asChild>
                    <Link href="/business">{t("business")}</Link>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" className="md:h-10 md:px-4 md:text-sm" asChild>
                  <Link href="/profile">{t("account")}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                <Button variant="outline" size="sm" className="md:h-10 md:px-4 md:text-sm" asChild>
                  <Link href="/auth/signup">{t("signUp")}</Link>
                </Button>
                <Button size="sm" className="md:h-10 md:px-4 md:text-sm" asChild>
                  <Link href="/auth/signin">{t("signIn")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        <HeaderPrimaryNavMobile />
      </div>
    </header>
  );
}
