import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAdminSubmissions } from "@/server/queries/admin/list-admin-submissions";

type AdminSubmissionsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams?: Promise<{ status?: string; view?: string }>;
};

function formatDate(value: Date | null, locale: "de" | "tr") {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusTone(status: string) {
  return status === "PENDING"
    ? "warning"
    : status === "APPROVED" || status === "DONE"
      ? "success"
      : status === "REJECTED" || status === "FAILED"
        ? "danger"
        : "default";
}

function getOriginTone(origin: string) {
  return origin === "user_submission" ? "success" : "default";
}

function getStatusPriority(status: string) {
  if (status === "PENDING") {
    return 0;
  }

  if (status === "APPROVED" || status === "DONE") {
    return 1;
  }

  if (status === "REJECTED" || status === "FAILED") {
    return 2;
  }

  return 3;
}

function compareSubmissionsByReviewPriority<
  T extends {
    status: string;
    hasWarnings: boolean;
    origin: string;
    createdAt: Date;
  },
>(left: T, right: T) {
  const statusDiff = getStatusPriority(left.status) - getStatusPriority(right.status);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  if (left.status === "PENDING" && right.status === "PENDING") {
    if (left.hasWarnings !== right.hasWarnings) {
      return left.hasWarnings ? -1 : 1;
    }

    if (left.origin !== right.origin) {
      return left.origin === "user_submission" ? -1 : 1;
    }
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function buildFilterHref(args: {
  statusFilter: string;
  viewFilter: string;
  nextStatus?: string;
  nextView?: string;
}) {
  const search = new URLSearchParams();
  const status = args.nextStatus ?? args.statusFilter;
  const view = args.nextView ?? args.viewFilter;

  if (status !== "all") {
    search.set("status", status);
  }

  if (view !== "all") {
    search.set("view", view);
  }

  const query = search.toString();
  return query ? `/admin/ingest/submissions?${query}` : "/admin/ingest/submissions";
}

export default async function AdminSubmissionsPage({
  params,
  searchParams,
}: AdminSubmissionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [t, submissions] = await Promise.all([
    getTranslations("admin"),
    listAdminSubmissions(),
  ]);

  const totalCount = submissions.length;
  const pendingCount = submissions.filter((submission) => submission.status === "PENDING").length;
  const approvedCount = submissions.filter(
    (submission) => submission.status === "APPROVED" || submission.status === "DONE",
  ).length;
  const rejectedCount = submissions.filter(
    (submission) => submission.status === "REJECTED" || submission.status === "FAILED",
  ).length;
  const userSubmissionCount = submissions.filter(
    (submission) => submission.origin === "user_submission",
  ).length;
  const warningCount = submissions.filter((submission) => submission.hasWarnings).length;
  const sourceCount = submissions.filter((submission) => submission.sourcePresent).length;
  const systemSubmissionCount = submissions.filter(
    (submission) => submission.origin === "system_submission",
  ).length;
  const placeCount = submissions.filter((submission) => submission.targetEntityType === "PLACE").length;
  const eventCount = submissions.filter((submission) => submission.targetEntityType === "EVENT").length;

  const statusFilter =
    resolvedSearchParams?.status === "pending" ||
    resolvedSearchParams?.status === "approved" ||
    resolvedSearchParams?.status === "rejected"
      ? resolvedSearchParams.status
      : "all";
  const viewFilter =
    resolvedSearchParams?.view === "user" ||
    resolvedSearchParams?.view === "warnings" ||
    resolvedSearchParams?.view === "source" ||
    resolvedSearchParams?.view === "places" ||
    resolvedSearchParams?.view === "events"
      ? resolvedSearchParams.view
      : "all";

  const filteredSubmissions = submissions
    .filter((submission) => {
      if (statusFilter === "pending" && submission.status !== "PENDING") {
        return false;
      }

      if (
        statusFilter === "approved" &&
        submission.status !== "APPROVED" &&
        submission.status !== "DONE"
      ) {
        return false;
      }

      if (
        statusFilter === "rejected" &&
        submission.status !== "REJECTED" &&
        submission.status !== "FAILED"
      ) {
        return false;
      }

      if (viewFilter === "user" && submission.origin !== "user_submission") {
        return false;
      }

      if (viewFilter === "warnings" && !submission.hasWarnings) {
        return false;
      }

      if (viewFilter === "source" && !submission.sourcePresent) {
        return false;
      }

      if (viewFilter === "places" && submission.targetEntityType !== "PLACE") {
        return false;
      }

      if (viewFilter === "events" && submission.targetEntityType !== "EVENT") {
        return false;
      }

      return true;
    })
    .sort(compareSubmissionsByReviewPriority);

  return (
    <AdminShell
      locale={locale}
      pathname={`/${locale}/admin/ingest`}
      title={t("submissions.title")}
      description={t("submissions.description")}
      labels={{
        overview: t("nav.overview"),
        reports: t("nav.reports"),
        claims: t("nav.claims"),
        aiReview: t("nav.aiReview"),
        ingest: t("nav.ingest"),
        places: t("nav.places"),
        logs: t("nav.logs"),
      }}
    >
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextStatus: "all", nextView: viewFilter })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.all", { count: totalCount })}
            </Link>
            <Link
              href={buildFilterHref({
                statusFilter,
                viewFilter,
                nextStatus: "pending",
                nextView: viewFilter,
              })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "pending"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.pending", { count: pendingCount })}
            </Link>
            <Link
              href={buildFilterHref({
                statusFilter,
                viewFilter,
                nextStatus: "approved",
                nextView: viewFilter,
              })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "approved"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.approved", { count: approvedCount })}
            </Link>
            <Link
              href={buildFilterHref({
                statusFilter,
                viewFilter,
                nextStatus: "rejected",
                nextView: viewFilter,
              })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                statusFilter === "rejected"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.filters.rejected", { count: rejectedCount })}
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "all" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.all", { count: totalCount })}
            </Link>
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "user" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "user"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.user", { count: userSubmissionCount })}
            </Link>
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "warnings" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "warnings"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.warnings", { count: warningCount })}
            </Link>
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "source" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "source"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.source", { count: sourceCount })}
            </Link>
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "places" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "places"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.places", { count: placeCount })}
            </Link>
            <Link
              href={buildFilterHref({ statusFilter, viewFilter, nextView: "events" })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewFilter === "events"
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t("submissions.views.events", { count: eventCount })}
            </Link>
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("submissions.empty")}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("submissions.summary", {
                  total: totalCount,
                  pending: pendingCount,
                  approved: approvedCount,
                  rejected: rejectedCount,
                })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.pending")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.warnings")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{warningCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.userSubmissions")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {userSubmissionCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.systemSubmissions")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {systemSubmissionCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.approved")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{approvedCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.rejected")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{rejectedCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.places")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{placeCount}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("submissions.overview.events")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{eventCount}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("submissions.priority.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("submissions.priority.description")}
                </p>
              </div>

              <div className="space-y-3">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-border bg-white px-4 py-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            tone={getStatusTone(submission.status)}
                            label={submission.status}
                          />
                          <StatusBadge
                            tone={getOriginTone(submission.origin)}
                            label={t(`submissions.origins.${submission.origin}`)}
                          />
                          <StatusBadge
                            tone="default"
                            label={t(
                              `submissions.entityTypes.${(submission.targetEntityType ?? "unknown").toLowerCase()}`,
                            )}
                          />
                          <span className="rounded-full border border-border/80 bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            {submission.submissionType}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {submission.label}
                          </h3>
                          <p className="break-all text-xs text-muted-foreground">{submission.id}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(submission.createdAt, locale) ??
                          t("submissions.fallbacks.notAvailable")}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="font-medium text-foreground">{t("submissions.cards.city")}</p>
                        <p className="text-muted-foreground">
                          {submission.cityNameDe && submission.cityNameTr
                            ? locale === "tr"
                              ? submission.cityNameTr
                              : submission.cityNameDe
                            : t("submissions.fallbacks.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("submissions.cards.category")}
                        </p>
                        <p className="text-muted-foreground">
                          {(locale === "tr"
                            ? submission.categoryLabelTr
                            : submission.categoryLabelDe) ?? t("submissions.fallbacks.notAvailable")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("submissions.cards.source")}</p>
                        <p className="break-all text-muted-foreground">
                          {submission.sourcePresent
                            ? submission.sourceUrl
                            : t("submissions.cards.noSource")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("submissions.cards.location")}
                        </p>
                        <p className="text-muted-foreground">
                          {submission.addressOrVenue ?? t("submissions.fallbacks.notAvailable")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="font-medium text-foreground">
                        {t("submissions.cards.preview")}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {submission.descriptionPreview ?? t("submissions.cards.noPreview")}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {t("submissions.cards.traceability")}
                        </p>
                        <p className="text-muted-foreground">
                          {t("submissions.cards.traceabilityCopy", {
                            origin: t(`submissions.origins.${submission.origin}`),
                            target: t(
                              `submissions.entityTypes.${(submission.targetEntityType ?? "unknown").toLowerCase()}`,
                            ),
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("submissions.cards.submissionContext")}
                        </p>
                        <p className="text-muted-foreground">
                          {submission.compactPayloadSummary ??
                            submission.notes ??
                            t("submissions.cards.noContext")}
                        </p>
                      </div>
                    </div>

                    {submission.notes ? (
                      <div className="mt-4 space-y-2">
                        <p className="font-medium text-foreground">{t("submissions.cards.notes")}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {submission.notes}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {submission.reviewSignals.length > 0 ? (
                        submission.reviewSignals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                          >
                            {t(`submissions.reviewSignals.${signal}`)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          {t("submissions.reviewSignals.noWarnings")}
                        </span>
                      )}
                    </div>

                    {submission.targetAdminPath ? (
                      <div className="mt-4 flex justify-end">
                        <Link
                          href={submission.targetAdminPath}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                        >
                          {t("submissions.cards.openTarget")}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
