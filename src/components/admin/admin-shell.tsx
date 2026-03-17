import { cn } from "@/lib/utils";

type AdminShellProps = {
  locale: "de" | "tr";
  pathname: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  labels: {
    overview: string;
    reports: string;
    claims: string;
    aiReview?: string;
    places?: string;
    logs: string;
  };
};

export function AdminShell({
  locale,
  pathname,
  title,
  description,
  children,
  labels,
}: AdminShellProps) {
  const items = [
    { href: `/${locale}/admin`, label: labels.overview },
    { href: `/${locale}/admin/reports`, label: labels.reports },
    { href: `/${locale}/admin/claims`, label: labels.claims },
    ...(labels.aiReview
      ? [{ href: `/${locale}/admin/ai-review`, label: labels.aiReview }]
      : []),
    ...(labels.places
      ? [{ href: `/${locale}/admin/places`, label: labels.places }]
      : []),
    { href: `/${locale}/admin/logs`, label: labels.logs },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Admin
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-4xl text-foreground">{title}</h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border bg-white/90 p-2 shadow-soft">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {children}
    </div>
  );
}
