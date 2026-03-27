"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Fehler
        </p>
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          Bitte versuche es erneut. Wenn das Problem bestehen bleibt, pruefe die
          Konfiguration oder lade die Seite spaeter neu.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c40815]"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    </div>
  );
}
