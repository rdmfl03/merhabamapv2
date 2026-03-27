import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          404
        </p>
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">
          Seite nicht gefunden
        </h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          Die angeforderte Seite ist nicht verfuegbar oder wurde verschoben.
        </p>
        <div className="pt-2">
          <Link
            href="/de"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c40815]"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
