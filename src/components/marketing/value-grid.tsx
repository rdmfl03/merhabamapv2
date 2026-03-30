import { Card, CardContent } from "@/components/ui/card";

type ValueItem = {
  eyebrow: string;
  title: string;
  description: string;
};

type ValueGridProps = {
  items: ValueItem[];
  /** When true, renders only the grid (no outer section) for use inside the landing hero shell. */
  embedded?: boolean;
};

export function ValueGrid({ items, embedded = false }: ValueGridProps) {
  const grid = (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <Card
          key={item.title}
          className={
            embedded
              ? "border-border/45 bg-white/78 shadow-none backdrop-blur-md transition-colors hover:border-brand/25 hover:bg-white/88"
              : index === 0
                ? "border-brand/15 bg-[#f7f8fb] shadow-none transition-colors hover:border-brand/30"
                : "border-border/80 bg-white/80 shadow-none transition-colors hover:border-brand/20"
          }
        >
            <CardContent className="space-y-2.5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {item.eyebrow}
              </p>
              {embedded ? (
                <h3 className="font-display text-[1.75rem] leading-tight text-foreground">
                  {item.title}
                </h3>
              ) : (
                <h2 className="font-display text-[1.75rem] leading-tight text-foreground">
                  {item.title}
                </h2>
              )}
              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
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
