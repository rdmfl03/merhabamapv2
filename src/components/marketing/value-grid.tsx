import { Card, CardContent } from "@/components/ui/card";

type ValueItem = {
  eyebrow: string;
  title: string;
  description: string;
};

type ValueGridProps = {
  items: ValueItem[];
};

export function ValueGrid({ items }: ValueGridProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={item.title}
            className={
              index === 0
                ? "border-brand/15 bg-[#f7f8fb] shadow-none transition-colors hover:border-brand/30"
                : "border-border/80 bg-white/80 shadow-none transition-colors hover:border-brand/20"
            }
          >
            <CardContent className="space-y-2.5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {item.eyebrow}
              </p>
              <h2 className="font-display text-[1.75rem] leading-tight text-foreground">
                {item.title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
