import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { canAccessBusiness } from "@/lib/permissions";

export async function Header() {
  const [t, session] = await Promise.all([
    getTranslations("common"),
    auth(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-brand-foreground">
              MM
            </div>
            <div>
              <p className="font-display text-lg text-foreground">{t("brandName")}</p>
              <p className="text-xs text-muted-foreground">{t("taglineShort")}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/cities/berlin" className="text-sm text-muted-foreground transition hover:text-foreground">
              {t("cities")}
            </Link>
            <Link href="/places" className="text-sm text-muted-foreground transition hover:text-foreground">
              {t("places")}
            </Link>
            <Link href="/events" className="text-sm text-muted-foreground transition hover:text-foreground">
              {t("events")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
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

        <nav className="mt-4 flex items-center gap-4 overflow-x-auto md:hidden">
          <Link href="/cities/berlin" className="whitespace-nowrap text-sm text-muted-foreground">
            {t("cities")}
          </Link>
          <Link href="/places" className="whitespace-nowrap text-sm text-muted-foreground">
            {t("places")}
          </Link>
          <Link href="/events" className="whitespace-nowrap text-sm text-muted-foreground">
            {t("events")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
