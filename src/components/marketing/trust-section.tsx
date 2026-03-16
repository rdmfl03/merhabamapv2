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
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="rounded-[2rem] border border-border/80 bg-[#f7f8fb] p-5 shadow-soft sm:p-6">
        <div className="space-y-2.5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl text-foreground sm:text-[2.4rem]">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <Card key={item.title} className="border-border/70 bg-white/80 shadow-none">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
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
