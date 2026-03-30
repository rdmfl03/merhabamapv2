import { ArrowRight, Check, MapPinned } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type PublicHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  trustTitle: string;
  trustPoints: string[];
};

export function PublicHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  trustTitle,
  trustPoints,
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
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
                <Button
                  size="lg"
                  className="h-12 rounded-full px-7 text-base shadow-md shadow-brand/25 transition-shadow hover:shadow-lg hover:shadow-brand/30"
                  asChild
                >
                  <Link href="/places">
                    {primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-border/80 bg-white/80 px-7 text-base backdrop-blur-sm transition-colors hover:bg-white"
                  asChild
                >
                  <Link href="/events">{secondaryCta}</Link>
                </Button>
              </div>
            </div>

            <aside
              className="relative flex min-h-0 flex-col justify-center rounded-3xl border border-brand/10 bg-gradient-to-b from-card/95 via-card/90 to-brand/[0.04] p-6 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-black/[0.04] backdrop-blur-sm sm:p-7"
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
                  <li key={point} className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm shadow-brand/30">
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
      </div>
    </section>
  );
}
