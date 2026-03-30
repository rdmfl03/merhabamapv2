import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type SavedEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel: string;
  /** Locale-agnostic path, e.g. `/places` (Link adds the active locale). */
  href: string;
};

export function SavedEmptyState({
  title,
  description,
  ctaLabel,
  href,
}: SavedEmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-white/90 p-8 text-center shadow-soft">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
