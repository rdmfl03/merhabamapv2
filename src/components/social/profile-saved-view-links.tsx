import { LayoutGrid, List } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Default on profile is list view; only emit query params when switching to grid. */
function buildQuery(placesView: "grid" | "list", eventsView: "grid" | "list") {
  const q = new URLSearchParams();
  if (placesView === "grid") {
    q.set("placesView", "grid");
  }
  if (eventsView === "grid") {
    q.set("eventsView", "grid");
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

type ProfileSavedViewLinksProps = {
  variant: "places" | "events";
  placesView: "grid" | "list";
  eventsView: "grid" | "list";
  profileHandle: string;
  labels: {
    grid: string;
    list: string;
    groupPlaces: string;
    groupEvents: string;
  };
};

export function ProfileSavedViewLinks({
  variant,
  placesView,
  eventsView,
  profileHandle,
  labels,
}: ProfileSavedViewLinksProps) {
  const base = `/user/${encodeURIComponent(profileHandle)}`;
  const gridQuery = buildQuery(
    variant === "places" ? "grid" : placesView,
    variant === "events" ? "grid" : eventsView,
  );
  const listQuery = buildQuery(
    variant === "places" ? "list" : placesView,
    variant === "events" ? "list" : eventsView,
  );
  const activeGrid = variant === "places" ? placesView === "grid" : eventsView === "grid";
  const activeList = variant === "places" ? placesView === "list" : eventsView === "list";

  return (
    <div
      className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm"
      role="group"
      aria-label={variant === "places" ? labels.groupPlaces : labels.groupEvents}
    >
      <Link
        href={`${base}${gridQuery}`}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-2 transition-colors",
          activeGrid
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={activeGrid ? "true" : undefined}
        title={labels.grid}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        <span className="sr-only">{labels.grid}</span>
      </Link>
      <Link
        href={`${base}${listQuery}`}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-2 transition-colors",
          activeList
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={activeList ? "true" : undefined}
        title={labels.list}
      >
        <List className="h-4 w-4" aria-hidden />
        <span className="sr-only">{labels.list}</span>
      </Link>
    </div>
  );
}
