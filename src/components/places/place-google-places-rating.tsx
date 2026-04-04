import { Star } from "lucide-react";

import type { GooglePlacesRatingSnapshot } from "@/lib/google-places-display";

type PlaceGooglePlacesRatingAsideProps = {
  locale: "de" | "tr";
  snapshot: GooglePlacesRatingSnapshot;
  labels: {
    title: string;
    reviews: string;
    updatedLabel: string;
  };
};

/** Dezentes Zusatzmodul, wenn Google-Daten **zusätzlich** zu einer zusammengeführten Anzeige existieren. */
export function PlaceGooglePlacesRatingAside({
  locale,
  snapshot,
  labels,
}: PlaceGooglePlacesRatingAsideProps) {
  const countLocale = locale === "tr" ? "tr-TR" : "de-DE";
  const updated =
    snapshot.lastSyncedAt != null
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeZone: "Europe/Berlin",
        }).format(snapshot.lastSyncedAt)
      : null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.title}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-foreground/90">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
          <span className="font-medium tabular-nums">{snapshot.ratingValue.toFixed(1)} / 5</span>
        </span>
        <span className="text-muted-foreground">
          ·{" "}
          {new Intl.NumberFormat(countLocale).format(snapshot.userRatingCount)}{" "}
          {labels.reviews}
        </span>
      </div>
      {updated ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {labels.updatedLabel} {updated}
        </p>
      ) : null}
    </div>
  );
}

type PlaceGooglePlacesFootnoteProps = {
  text: string;
};

/** Eine Zeile Hinweis unter der Hauptbewertung, wenn nur Google als Quelle geliefert wird. */
export function PlaceGooglePlacesFootnote({ text }: PlaceGooglePlacesFootnoteProps) {
  return <p className="mt-2 text-xs text-muted-foreground">{text}</p>;
}
