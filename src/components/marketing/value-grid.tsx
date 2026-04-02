import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type ValueItem = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
};

type ValueGridProps = {
  items: ValueItem[];
  /** When true, renders only the grid (no outer section) for use inside the landing hero shell. */
  embedded?: boolean;
};

export function ValueGrid({ items, embedded = false }: ValueGridProps) {
  const grid = (
    <div className="grid items-stretch gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <Card
          key={item.title}
          className={
            embedded
              ? index === 0
                ? "flex h-full self-stretch border-brand/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(252,247,247,0.96)_100%)] shadow-[0_24px_52px_-30px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/26 hover:bg-white/96 hover:shadow-[0_30px_64px_-30px_rgba(15,23,42,0.22)]"
                : index === 1
                  ? "flex h-full self-stretch border-border/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(248,250,252,0.96)_100%)] shadow-[0_24px_52px_-30px_rgba(15,23,42,0.17)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/24 hover:bg-white/96 hover:shadow-[0_30px_64px_-30px_rgba(15,23,42,0.22)]"
                  : "flex h-full self-stretch border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,250,251,0.97)_100%)] shadow-[0_24px_52px_-30px_rgba(15,23,42,0.17)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/24 hover:bg-white/96 hover:shadow-[0_30px_64px_-30px_rgba(15,23,42,0.22)]"
              : index === 0
                ? "flex h-full border-brand/12 bg-[linear-gradient(180deg,rgba(247,248,251,0.95)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_14px_34px_-28px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/24 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.16)]"
                : "flex h-full border-border/70 bg-white/88 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/22 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.16)]"
          }
        >
            <CardContent className="grid h-full w-full flex-1 grid-rows-[auto_auto_1fr_auto] gap-4 p-5 pt-7 sm:p-6 sm:pt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {item.eyebrow}
              </p>
              {embedded ? (
                <h3 className="max-w-[12ch] font-display text-[1.7rem] leading-[1.1] text-foreground">
                  {item.title}
                </h3>
              ) : (
                <h2 className="max-w-[12ch] font-display text-[1.7rem] leading-[1.1] text-foreground">
                  {item.title}
                </h2>
              )}
              <p className="max-w-[30ch] text-sm leading-[1.72] text-muted-foreground sm:text-[0.96rem]">
                {item.description}
              </p>
              {embedded && item.ctaLabel && item.href ? (
                <div className="self-end pt-4">
                  <Button
                    className="h-auto w-full rounded-full border border-transparent bg-brand px-5 py-3 text-base font-medium text-brand-foreground shadow-md shadow-brand/25 transition-all hover:bg-brand/95 hover:shadow-lg hover:shadow-brand/30"
                    asChild
                  >
                    <Link href={item.href} className="inline-flex items-center justify-center gap-2">
                      <span>{item.ctaLabel}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
    </div>
  );

  if (embedded) {
    return grid;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {grid}
    </section>
  );
}
