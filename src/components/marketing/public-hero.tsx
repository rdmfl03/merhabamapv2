import { ArrowRight, CheckCircle2, MapPinned } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-[#f5f6f8] shadow-soft">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 right-0 hidden w-[49%] lg:block">
            <Image
              src="/hero-map-bg.svg"
              alt=""
              fill
              priority
              className="object-contain object-right"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,244,241,0.98)_0%,rgba(247,244,241,0.98)_58%,rgba(247,244,241,0.84)_72%,rgba(247,244,241,0.36)_100%)]" />
        </div>
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="max-w-[44rem] space-y-5 rounded-[2rem] bg-[#f5f6f8]/96 p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {eyebrow}
              </p>
              <h1 className="max-w-3xl font-display text-4xl leading-[0.98] text-foreground sm:text-5xl lg:text-[4.2rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.05rem]">
                {description}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/places">
                    {primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/events">{secondaryCta}</Link>
                </Button>
              </div>
            </div>

            <Card className="border-brand/20 bg-[#f7f8fb]/98 shadow-none backdrop-blur-[1px]">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  <MapPinned className="h-4 w-4" />
                  <span>{trustTitle}</span>
                </div>
                <div className="space-y-2.5">
                  {trustPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/92 px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
