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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/70">
              <Image
                src="/logo-pin.svg"
                alt="MerhabaMap logo"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{t("brandName")}</p>
              <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
                {t("taglineShort")}
              </p>
            </div>
          </Link>

          <HeaderPrimaryNavDesktop />

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            {session?.user ? (
              <div className="flex items-center gap-2">
                {canAccessBusiness(session.user.role) ? (
                  <Button variant="outline" asChild>
                    <Link href="/business">{t("business")}</Link>
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href="/profile">{t("account")}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/auth/signup">{t("signUp")}</Link>
                </Button>
                <Button asChild>
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
