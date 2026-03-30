import { Fragment } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Compact navigation between legal/trust documents — avoids dead ends when users open a legal URL directly.
 */
export async function LegalCrossLinks() {
  const t = await getTranslations("legal");

  const items = [
    { href: "/impressum" as const, label: t("navigation.impressum") },
    { href: "/privacy" as const, label: t("navigation.privacy") },
    { href: "/terms" as const, label: t("navigation.terms") },
    { href: "/community-rules" as const, label: t("navigation.communityRules") },
    { href: "/cookies" as const, label: t("navigation.cookies") },
    { href: "/contact" as const, label: t("navigation.contact") },
  ];

  return (
    <nav
      className="border-t border-border/70 pt-8"
      aria-label={t("crossLinksAria")}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {t("crossLinksTitle")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        {items.map(({ href, label }, index) => (
          <Fragment key={href}>
            {index > 0 ? (
              <span className="text-border" aria-hidden>
                ·
              </span>
            ) : null}
            <Link href={href} className="text-brand underline-offset-2 hover:underline">
              {label}
            </Link>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
