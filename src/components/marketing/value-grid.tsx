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
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title} className="bg-white/90">
            <CardContent className="space-y-3 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {item.eyebrow}
              </p>
              <h2 className="font-display text-2xl text-foreground">{item.title}</h2>
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
