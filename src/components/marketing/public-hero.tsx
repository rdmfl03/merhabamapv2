import { ArrowRight, CheckCircle2, MapPinned } from "lucide-react";

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
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-16">
      <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-white/90 shadow-soft">
        <div className="bg-hero-glow px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {eyebrow}
              </p>
              <h1 className="max-w-3xl font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
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

            <Card className="border-brand/10 bg-white/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  <MapPinned className="h-4 w-4" />
                  <span>{trustTitle}</span>
                </div>
                <div className="space-y-3">
                  {trustPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
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
