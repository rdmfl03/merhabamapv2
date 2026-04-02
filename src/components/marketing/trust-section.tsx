import { ShieldCheck, Store, TriangleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type TrustSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    title: string;
    description: string;
  }>;
};

const icons = [ShieldCheck, TriangleAlert, Store];

export function TrustSection({
  eyebrow,
  title,
  description,
  items,
}: TrustSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-7 sm:py-8">
      <div className="rounded-[2rem] border border-border/75 bg-[linear-gradient(180deg,#f8f9fc_0%,#fcfcfd_100%)] p-5 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.11)] sm:p-6">
        <div className="space-y-2.5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <h2 className="font-display text-3xl leading-tight text-foreground sm:text-[2.25rem]">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem] lg:justify-self-end">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            const featured = index === 0;
            return (
              <Card
                key={item.title}
                className={
                  featured
                    ? "border-brand/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,250,251,0.98)_100%)] shadow-[0_16px_36px_-26px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/22 hover:shadow-[0_22px_46px_-26px_rgba(15,23,42,0.16)]"
                    : "border-border/65 bg-white/90 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/18 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.13)]"
                }
              >
                <CardContent className="space-y-3.5 p-5 sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="max-w-[18ch] text-[1.05rem] font-semibold leading-snug text-foreground">{item.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
