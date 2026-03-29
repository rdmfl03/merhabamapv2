import type { ReactNode } from "react";

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** Optional Hinweisbox; wird nur gerendert, wenn nicht leer. */
  notice?: string;
  children: ReactNode;
}) {
  const trimmedNotice = notice?.trim() ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">{title}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">{intro}</p>
          {trimmedNotice ? (
            <div className="rounded-3xl border border-brand/20 bg-brand-soft px-5 py-4 text-sm leading-6 text-foreground">
              {trimmedNotice}
            </div>
          ) : null}
        </header>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
