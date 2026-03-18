import { StatusBadge } from "@/components/admin/status-badge";

type AllowlistEvaluation = {
  allowed: boolean;
  reasonCode: string | null;
  failureGroup: string | null;
  normalizedEntityType: string | null;
  normalizedCity: string | null;
  normalizedCategory: string | null;
  normalizedSourceType: string | null;
  normalizedSourceHost: string | null;
  matchedSourceKey: string | null;
  matchedSourceLabel: string | null;
};

type AllowlistEvaluationSummaryLabels = {
  title: string;
  pass: string;
  blocked: string;
  passSummary: string;
  blockedSummary: string;
  rule: string;
  fields: {
    entity: string;
    city: string;
    category: string;
    sourceType: string;
    sourceHost: string;
    matchedSource: string;
  };
  failureGroups: Record<string, string>;
  reasonCodes: Record<string, string>;
};

type AllowlistEvaluationSummaryProps = {
  evaluation: AllowlistEvaluation;
  labels: AllowlistEvaluationSummaryLabels;
};

function renderFact(label: string, value: string) {
  return (
    <span className="rounded-full border border-border bg-white px-2.5 py-1">
      <span className="font-medium text-foreground">{label}:</span> {value}
    </span>
  );
}

export function AllowlistEvaluationSummary({
  evaluation,
  labels,
}: AllowlistEvaluationSummaryProps) {
  const summaryClassName = evaluation.allowed
    ? "border-emerald-200 bg-emerald-50/80"
    : "border-amber-200 bg-amber-50/80";

  const summaryText = evaluation.allowed
    ? labels.passSummary
    : `${labels.blockedSummary}: ${
        evaluation.failureGroup ? labels.failureGroups[evaluation.failureGroup] : labels.blocked
      }`;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${summaryClassName}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {labels.title}
        </p>
        <StatusBadge tone={evaluation.allowed ? "success" : "warning"} label={evaluation.allowed ? labels.pass : labels.blocked} />
        <p className="text-sm text-muted-foreground">{summaryText}</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {renderFact(
          labels.rule,
          evaluation.reasonCode ? labels.reasonCodes[evaluation.reasonCode] ?? evaluation.reasonCode : labels.pass,
        )}
        {evaluation.normalizedEntityType
          ? renderFact(labels.fields.entity, evaluation.normalizedEntityType)
          : null}
        {evaluation.normalizedCity ? renderFact(labels.fields.city, evaluation.normalizedCity) : null}
        {evaluation.normalizedCategory
          ? renderFact(labels.fields.category, evaluation.normalizedCategory)
          : null}
        {evaluation.normalizedSourceType
          ? renderFact(labels.fields.sourceType, evaluation.normalizedSourceType)
          : null}
        {evaluation.normalizedSourceHost
          ? renderFact(labels.fields.sourceHost, evaluation.normalizedSourceHost)
          : null}
        {evaluation.matchedSourceLabel
          ? renderFact(labels.fields.matchedSource, evaluation.matchedSourceLabel)
          : null}
      </div>
    </div>
  );
}
