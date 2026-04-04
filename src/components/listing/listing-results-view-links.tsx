import { LayoutGrid, List } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ListingResultsViewLinksProps = {
  /** Path without locale prefix, e.g. `/places?city=berlin` */
  listHref: string;
  gridHref: string;
  activeLayout: "grid" | "list";
  labels: {
    grid: string;
    list: string;
    group: string;
  };
};

export function ListingResultsViewLinks({
  listHref,
  gridHref,
  activeLayout,
  labels,
}: ListingResultsViewLinksProps) {
  return (
    <div
      className="inline-flex shrink-0 rounded-full border border-border bg-white p-1 shadow-sm"
      role="group"
      aria-label={labels.group}
    >
      <Link
        href={gridHref}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-2 transition-colors",
          activeLayout === "grid"
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={activeLayout === "grid" ? "true" : undefined}
        title={labels.grid}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        <span className="sr-only">{labels.grid}</span>
      </Link>
      <Link
        href={listHref}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-2 transition-colors",
          activeLayout === "list"
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={activeLayout === "list" ? "true" : undefined}
        title={labels.list}
      >
        <List className="h-4 w-4" aria-hidden />
        <span className="sr-only">{labels.list}</span>
      </Link>
    </div>
  );
}
