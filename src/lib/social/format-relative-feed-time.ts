import type { AppLocale } from "@/i18n/routing";

/**
 * Kurze relative Zeitangaben für den Feed (lokalisiert, ohne zusätzliche Abhängigkeiten).
 */
export function formatRelativeFeedTime(iso: string, locale: AppLocale): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const absSec = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) {
    return rtf.format(Math.round(diffSec), "second");
  }
  if (absSec < 3600) {
    const m = Math.round(diffSec / 60);
    return rtf.format(m, "minute");
  }
  if (absSec < 86400) {
    const h = Math.round(diffSec / 3600);
    return rtf.format(h, "hour");
  }
  if (absSec < 7 * 86400) {
    const d = Math.round(diffSec / 86400);
    return rtf.format(d, "day");
  }
  if (absSec < 30 * 86400) {
    const w = Math.round(diffSec / (7 * 86400));
    return rtf.format(w, "week");
  }

  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: then < now - 365 * 86400000 ? "numeric" : undefined,
  });
}
