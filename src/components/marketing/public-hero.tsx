import { ArrowRight, Check, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ValueGrid } from "@/components/marketing/value-grid";
import { Link } from "@/i18n/navigation";

type PillarItem = {
  eyebrow: string;
  title: string;
  description: string;
  communityLine?: string;
  signal?: string;
};

type PublicHeroProps = {
  eyebrow: string;
  claim?: string;
  title: string;
  description: string;
  mapCta: string;
  trustTitle: string;
  trustPoints: string[];
  pillars: PillarItem[];
};

export function PublicHero({
  eyebrow,
  claim,
  title,
  description,
  mapCta,
  trustTitle,
  trustPoints,
  pillars,
}: PublicHeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/45 bg-slate-100 shadow-[0_26px_70px_-26px_rgba(15,23,42,0.16),0_0_0_1px_rgba(15,23,42,0.04)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,10,23,0.08)_0%,rgba(255,255,255,0.95)_34%,rgba(255,255,255,0.98)_58%,rgba(248,250,252,0.96)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/78 via-white/34 to-transparent" />
          <div className="absolute inset-y-0 right-0 hidden w-[36%] bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.72)_40%,rgba(255,255,255,0.3)_100%)] lg:block" />
          <div className="absolute inset-y-10 right-[34%] hidden w-px bg-gradient-to-b from-transparent via-border/40 to-transparent lg:block" />
          <div className="absolute left-16 top-8 h-24 w-48 rounded-full bg-brand/[0.03] blur-3xl" />
          <div className="absolute right-10 top-16 h-44 w-44 rounded-full bg-brand/[0.05] blur-3xl" />
          <div className="absolute -right-10 bottom-4 h-44 w-44 rounded-full bg-brand/[0.04] blur-3xl" />
          <div className="absolute left-6 top-8 h-32 w-32 rounded-full border border-brand/[0.04]" />
          <div className="absolute left-1/2 top-12 h-40 w-40 rounded-full border border-brand/[0.04]" />
        </div>

        <div className="relative px-6 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 xl:gap-12">
            <div className="max-w-[44rem] space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand sm:text-sm">
                {eyebrow}
              </p>
              {claim ? (
                <p className="text-sm font-medium tracking-[0.01em] text-muted-foreground sm:text-[0.95rem]">
                  {claim}
                </p>
              ) : null}
              <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                {title}
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                {description}
              </p>
              <div className="pt-1">
                <Button
                  size="lg"
                  className="h-auto min-h-12 max-w-full rounded-full px-6 py-3 text-center text-base leading-snug shadow-md shadow-brand/25 transition-shadow hover:shadow-lg hover:shadow-brand/30 sm:max-w-xl sm:px-8 sm:text-left"
                  asChild
                >
                  <Link href="/map" className="inline-flex items-center justify-center gap-2">
                    <span className="text-balance">{mapCta}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <aside
                className="relative flex min-h-0 flex-col justify-center rounded-3xl border border-brand/10 bg-gradient-to-b from-card/95 via-card/92 to-brand/[0.045] p-6 pb-7 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.04] backdrop-blur-sm sm:p-7"
                aria-label={trustTitle}
              >
                <div className="absolute left-6 top-0 h-1 w-10 -translate-y-1/2 rounded-full bg-brand sm:left-7" />
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <MapPinned className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand sm:text-sm">
                    {trustTitle}
                  </p>
                </div>
                <ul className="space-y-0 divide-y divide-border/50">
                  {trustPoints.map((point) => (
                    <li key={point} className="flex gap-3 py-3.5 first:pt-0 last:pb-1 sm:gap-3.5 sm:last:pb-0">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm shadow-brand/20">
                        <Check className="h-3.5 w-3.5 stroke-[2.75]" aria-hidden />
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>

          {pillars.length > 0 ? (
            <div className="relative mt-10 border-t border-border/25 pt-10 sm:mt-12 sm:pt-12">
              <div className="mt-1 sm:mt-2">
                <ValueGrid embedded items={pillars} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
