import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import type { IngestSourceRolloutSection } from "@/config/ingest-allowlist";

type SourceRolloutV1ReferenceLabels = {
  title: string;
  description: string;
  activeBadge: string;
  actionLabel: string;
  sectionLabel: string;
  empty: string;
  fields: {
    sourceType: string;
    domains: string;
    accountHandles: string;
    externalIds: string;
    noSourceUrlRequired: string;
  };
  sections: Record<IngestSourceRolloutSection["key"], string>;
};

type SourceRolloutV1ReferenceProps = {
  sections: readonly IngestSourceRolloutSection[];
  labels: SourceRolloutV1ReferenceLabels;
  reviewHref: string;
};

function renderField(label: string, values: readonly string[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {values.join(", ")}
    </p>
  );
}

export function SourceRolloutV1Reference({
  sections,
  labels,
  reviewHref,
}: SourceRolloutV1ReferenceProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-foreground">{labels.title}</h2>
          <StatusBadge tone="success" label={labels.activeBadge} />
        </div>
        <Link
          href={reviewHref}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          {labels.actionLabel}
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">{labels.description}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.key} className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {labels.sectionLabel}
                </p>
                <p className="font-medium text-foreground">{labels.sections[section.key]}</p>
              </div>
              <StatusBadge tone="default" label={section.key} />
            </div>

            {section.entries.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{labels.empty}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {section.entries.map((entry) => (
                  <div key={entry.key} className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{entry.label}</p>
                        <p className="text-xs text-muted-foreground">{entry.key}</p>
                      </div>
                      <StatusBadge tone="pending" label={entry.sourceType} />
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{labels.fields.sourceType}:</span>{" "}
                        {entry.sourceType}
                      </p>
                      {renderField(labels.fields.domains, entry.domains ?? [])}
                      {renderField(labels.fields.accountHandles, entry.accountHandles ?? [])}
                      {renderField(labels.fields.externalIds, entry.externalIds ?? [])}
                      {entry.allowWithoutSourceUrl ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {labels.fields.noSourceUrlRequired}:
                          </span>{" "}
                          true
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
