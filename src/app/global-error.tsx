"use client";

export default function GlobalError() {
  return (
    <html lang="de">
      <body>
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e30a17]">
              Kritischer Fehler
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              MerhabaMap konnte nicht sicher geladen werden
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Bitte pruefe die Laufzeit-Konfiguration und lade die Seite erneut.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
