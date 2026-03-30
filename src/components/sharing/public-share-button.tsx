"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { recordClientProductInsight } from "@/server/actions/product-insights/record-client-product-insight";

type PublicShareButtonProps = {
  locale: AppLocale;
  /** Low-cardinality surface, e.g. `place_detail`, `event_detail`. */
  insightSurface?: string;
  /** When `APP_URL` is set; otherwise client uses `origin` + `canonicalPath`. */
  absoluteUrl: string | null;
  /** Path including locale, e.g. `/de/places/foo`. */
  canonicalPath: string;
  title: string;
  /** Optional short line for Web Share API (no tracking). */
  text?: string;
  className?: string;
};

export function PublicShareButton({
  locale,
  insightSurface,
  absoluteUrl,
  canonicalPath,
  title,
  text,
  className,
}: PublicShareButtonProps) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolveUrl = useCallback(() => {
    if (absoluteUrl) {
      return absoluteUrl;
    }
    if (typeof window === "undefined") {
      return "";
    }
    const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
    return `${window.location.origin}${path}`;
  }, [absoluteUrl, canonicalPath]);

  const handleClick = async () => {
    const url = resolveUrl();
    if (!url) {
      return;
    }

    setFailed(false);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        const payload: ShareData = { title, url };
        const trimmed = text?.trim();
        if (trimmed) {
          payload.text = trimmed;
        }
        await navigator.share(payload);
        void recordClientProductInsight({
          name: "share_click",
          locale,
          shareMethod: "native",
          ...(insightSurface ? { surface: insightSurface } : {}),
        });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      void recordClientProductInsight({
        name: "share_click",
        locale,
        shareMethod: "copy",
        ...(insightSurface ? { surface: insightSurface } : {}),
      });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2800);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 4000);
    }
  };

  const label = failed ? t("copyFailed") : copied ? t("copied") : t("label");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleClick}
      aria-label={t("ariaLabel")}
    >
      <Share2 className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-left">{label}</span>
    </Button>
  );
}
