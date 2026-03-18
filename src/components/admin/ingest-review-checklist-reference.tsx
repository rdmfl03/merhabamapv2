import { StatusBadge } from "@/components/admin/status-badge";

type IngestReviewChecklistReferenceLabels = {
  title: string;
  description: string;
  badge: string;
  sections: {
    places: string;
    events: string;
  };
  items: {
    validCity: string;
    clearTitle: string;
    plausibleLocation: string;
    sourceTraceability: string;
    noObviousDuplicates: string;
    noOutdatedEvents: string;
  };
};

type IngestReviewChecklistReferenceProps = {
  labels: IngestReviewChecklistReferenceLabels;
};

export function IngestReviewChecklistReference({
  labels,
}: IngestReviewChecklistReferenceProps) {
  const commonItems = [
    labels.items.validCity,
    labels.items.clearTitle,
    labels.items.plausibleLocation,
    labels.items.sourceTraceability,
    labels.items.noObviousDuplicates,
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-foreground">{labels.title}</h2>
        <StatusBadge tone="warning" label={labels.badge} />
      </div>
      <p className="text-sm text-muted-foreground">{labels.description}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {labels.sections.places}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {commonItems.map((item) => (
              <li key={item} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {labels.sections.events}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {[...commonItems, labels.items.noOutdatedEvents].map((item) => (
              <li key={item} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
