"use client";

import { useParams } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const copy = {
  de: {
    kicker: "Fehler",
    title: "Etwas ist schiefgelaufen",
    body: "Bitte versuche es erneut. Wenn das Problem bleibt, lade die Seite neu oder kehre zur Startseite zurück.",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  tr: {
    kicker: "Hata",
    title: "Bir şeyler ters gitti",
    body: "Lütfen tekrar dene. Sorun sürerse sayfayı yenile veya ana sayfaya dön.",
    retry: "Tekrar dene",
    home: "Ana sayfa",
  },
} as const;

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ reset }: LocaleErrorProps) {
  const params = useParams();
  const locale = params?.locale === "tr" ? "tr" : "de";
  const t = copy[locale];

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{t.kicker}</p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">{t.body}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button type="button" onClick={() => reset()}>
            {t.retry}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">{t.home}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
