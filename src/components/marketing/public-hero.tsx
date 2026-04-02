import { Check, MapPinned } from "lucide-react";

import { ValueGrid } from "@/components/marketing/value-grid";

type PillarItem = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
};

type PublicHeroProps = {
  eyebrow: string;
  claim?: string;
  title: string;
  description: string;
  trustTitle: string;
  trustPoints: string[];
  pillars: PillarItem[];
};

export function PublicHero({
  eyebrow,
  claim,
  title,
  description,
  trustTitle,
  trustPoints,
  pillars,
}: PublicHeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-5 sm:pt-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-slate-100 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.16),0_0_0_1px_rgba(15,23,42,0.04)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,10,23,0.08)_0%,rgba(255,248,248,0.94)_26%,rgba(255,255,255,0.98)_56%,rgba(248,250,252,0.97)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/74 via-white/24 to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(227,10,23,0.035)_0%,rgba(227,10,23,0.008)_18%,rgba(227,10,23,0.008)_82%,rgba(227,10,23,0.03)_100%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.62)_42%,rgba(255,255,255,0.24)_100%)] lg:block" />
          <div className="absolute inset-y-12 right-[35%] hidden w-px bg-gradient-to-b from-transparent via-border/35 to-transparent lg:block" />
          <div className="absolute inset-x-10 top-9 hidden h-[198px] rounded-[2rem] border border-brand/[0.05] lg:block" />
          <div className="absolute inset-x-16 top-14 hidden h-[174px] rounded-[1.75rem] bg-[repeating-linear-gradient(90deg,rgba(227,10,23,0.06)_0_1px,transparent_1px_74px),repeating-linear-gradient(180deg,rgba(15,23,42,0.035)_0_1px,transparent_1px_52px)] opacity-45 lg:block" />
          <div className="absolute inset-x-14 top-[6.75rem] hidden h-px bg-gradient-to-r from-transparent via-brand/18 to-transparent lg:block" />
          <div className="absolute left-24 top-7 hidden h-40 w-[26rem] bg-[linear-gradient(115deg,rgba(227,10,23,0.11),rgba(227,10,23,0))] opacity-35 lg:block" />
          <div className="absolute left-16 top-8 h-24 w-52 rounded-full bg-brand/[0.03] blur-3xl" />
          <div className="absolute right-14 top-14 h-36 w-36 rounded-full bg-brand/[0.04] blur-3xl" />
          <div className="absolute -right-8 bottom-8 h-36 w-36 rounded-full bg-brand/[0.032] blur-3xl" />
          <div className="absolute left-6 top-8 h-32 w-32 rounded-full border border-brand/[0.04]" />
          <div className="absolute left-[47%] top-14 h-36 w-36 rounded-full border border-brand/[0.035]" />
        </div>

        <div className="relative px-6 py-7 sm:px-10 sm:py-8 lg:px-14 lg:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-8 xl:gap-10">
            <div className="max-w-[43rem] space-y-7.5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand sm:text-sm">
                {eyebrow}
              </p>
              {claim ? (
                <p className="pb-1 text-sm font-medium tracking-[0.005em] text-foreground/68 sm:text-[0.95rem]">
                  {claim}
                </p>
              ) : null}
              <h1 className="max-w-[13ch] text-balance font-display text-[3.05rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[3.55rem] lg:text-[3.9rem] lg:leading-[1.06]">
                {title}
              </h1>
              <p className="max-w-[35rem] pt-2 text-pretty text-[0.98rem] leading-[1.76] text-muted-foreground sm:text-[1.02rem]">
                {description}
              </p>
            </div>

            <div className="relative">
              <aside
                className="relative mt-8 flex min-h-0 flex-col justify-center rounded-[2rem] border border-brand/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.93)_62%,rgba(251,244,244,0.92)_100%)] p-5 pb-5 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.035] backdrop-blur-sm sm:mt-10 sm:p-6 sm:pb-5"
                aria-label={trustTitle}
              >
                <div className="absolute left-6 top-0 h-1 w-9 -translate-y-1/2 rounded-full bg-brand sm:left-7" />
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <MapPinned className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand sm:text-sm">
                    {trustTitle}
                  </p>
                </div>
                <ul className="space-y-0 divide-y divide-border/45">
                  {trustPoints.map((point) => (
                    <li key={point} className="flex gap-3 py-3 first:pt-0 last:pb-1 sm:gap-3.5 sm:last:pb-0">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm shadow-brand/16">
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
            <div className="relative mt-6 border-t border-border/25 pt-6 sm:mt-7 sm:pt-7">
              <div className="mt-0.5 sm:mt-1">
                <ValueGrid embedded items={pillars} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
