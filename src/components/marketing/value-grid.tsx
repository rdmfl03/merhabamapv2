import { Card, CardContent } from "@/components/ui/card";

type ValueItem = {
  eyebrow: string;
  title: string;
  description: string;
  communityLine?: string;
  signal?: string;
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
              ? "border-border/50 bg-white/84 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.16)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/26 hover:bg-white/94 hover:shadow-[0_26px_56px_-28px_rgba(15,23,42,0.2)]"
              : index === 0
                ? "border-brand/12 bg-[linear-gradient(180deg,rgba(247,248,251,0.95)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_14px_34px_-28px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/24 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.16)]"
                : "border-border/70 bg-white/88 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/22 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.16)]"
          }
        >
            <CardContent className="space-y-3 p-5 pt-6 sm:p-6 sm:pt-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {item.eyebrow}
              </p>
              {embedded ? (
                <h3 className="font-display text-[1.68rem] leading-tight text-foreground">
                  {item.title}
                </h3>
              ) : (
                <h2 className="font-display text-[1.68rem] leading-tight text-foreground">
                  {item.title}
                </h2>
              )}
              <p className="text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                {item.description}
              </p>
              {item.communityLine ? (
                <p className="border-t border-border/45 pt-3 text-sm font-medium text-foreground/88">
                  {item.communityLine}
                </p>
              ) : null}
              {item.signal ? (
                <div className="pt-1">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                    {item.signal}
                  </span>
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
