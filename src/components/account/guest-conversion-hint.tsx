import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { guestAuthSignInHref, guestAuthSignUpHref } from "@/lib/auth/guest-auth-links";
import { GuestConversionHintLinks } from "@/components/account/guest-conversion-hint-links";

type GuestConversionHintProps = {
  locale: AppLocale;
  returnPath: string;
};

/**
 * Compact, secondary block explaining optional account benefits (guests only).
 * Use sparingly on public surfaces — not on every screen.
 */
export async function GuestConversionHint({ locale, returnPath }: GuestConversionHintProps) {
  const t = await getTranslations("guestConversion");
  const signInHref = guestAuthSignInHref(locale, returnPath);
  const signUpHref = guestAuthSignUpHref(locale, returnPath);

  return (
    <aside className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{t("title")}</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
        <li>{t("benefitSave")}</li>
        <li>{t("benefitCities")}</li>
        <li>{t("benefitFeed")}</li>
        <li>{t("benefitCollections")}</li>
        <li>{t("benefitComments")}</li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t("optional")}</p>
      <GuestConversionHintLinks
        locale={locale}
        signInHref={signInHref}
        signUpHref={signUpHref}
        signInLabel={t("signIn")}
        signUpLabel={t("signUp")}
      />
    </aside>
  );
}
