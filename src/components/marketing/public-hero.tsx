import { ArrowRight, Check, MapPinned } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ValueGrid } from "@/components/marketing/value-grid";
import { Link } from "@/i18n/navigation";

type PillarItem = {
  eyebrow: string;
  title: string;
  description: string;
};

type PublicHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  mapCta: string;
  trustTitle: string;
  trustPoints: string[];
  pillars: PillarItem[];
};

export function PublicHero({
  eyebrow,
  title,
  description,
  mapCta,
  trustTitle,
  trustPoints,
  pillars,
}: PublicHeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-slate-100 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.04)]">
        {/* Designed surface (SVG) + optional map accent + readability scrim */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/hero-surface-bg.svg"
            alt=""
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
          <div className="absolute inset-y-6 right-0 hidden w-[min(50%,480px)] opacity-[0.2] saturate-[0.9] lg:block">
            <Image
              src="/hero-map-bg.svg"
              alt=""
              fill
              className="object-contain object-right"
              sizes="480px"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/65 to-slate-50/50 lg:bg-[linear-gradient(105deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.78)_38%,rgba(248,250,252,0.45)_62%,rgba(248,250,252,0.12)_82%,transparent_100%)]"
            aria-hidden
          />
        </div>

        <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 xl:gap-16">
            <div className="max-w-[44rem] space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand sm:text-sm">
                {eyebrow}
              </p>
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

            <aside
              className="relative flex min-h-0 flex-col justify-center rounded-3xl border border-brand/10 bg-gradient-to-b from-card/95 via-card/90 to-brand/[0.04] p-6 pb-8 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-black/[0.04] backdrop-blur-sm sm:p-7 sm:pb-7"
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

          {pillars.length > 0 ? (
            <div className="relative mt-10 border-t border-border/25 pt-10 sm:mt-12 sm:pt-12">
              <ValueGrid embedded items={pillars} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
