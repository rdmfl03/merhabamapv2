import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { formatRelativeFeedTime } from "@/lib/social/format-relative-feed-time";
import type { PublicCommentRow } from "@/server/queries/comments/list-entity-comments";

import { CommentDeleteControl } from "./comment-delete-control";
import { EntityCommentReportControl } from "./entity-comment-report-control";

type EntityCommentItemProps = {
  comment: PublicCommentRow;
  locale: AppLocale;
  returnPath: string;
  viewerId: string | null;
  labels: {
    delete: string;
    authorFallback: string;
  };
  report?: {
    labels: {
      action: string;
      title: string;
      description: string;
      reasonLabel: string;
      detailsLabel: string;
      detailsPlaceholder: string;
      submit: string;
      success: string;
      error: string;
      cooldown: string;
      dailyLimit: string;
    };
    reasons: Array<{ value: string; label: string }>;
  };
};

export function EntityCommentItem({
  comment,
  locale,
  returnPath,
  viewerId,
  labels,
  report,
}: EntityCommentItemProps) {
  const displayName =
    comment.authorDisplayName?.trim() ||
    comment.authorUsername?.trim() ||
    labels.authorFallback;
  const profileHref = comment.authorUsername
    ? `/user/${encodeURIComponent(comment.authorUsername)}`
    : null;

  return (
    <li className="border-b border-border/60 py-4 last:border-b-0">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          {profileHref ? (
            <Link href={profileHref} className="text-sm font-semibold text-brand hover:underline">
              {displayName}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
          )}
          <time
            className="text-xs text-muted-foreground"
            dateTime={comment.createdAt.toISOString()}
          >
            {formatRelativeFeedTime(comment.createdAt.toISOString(), locale)}
          </time>
        </div>
        {viewerId && viewerId === comment.authorId ? (
          <CommentDeleteControl
            commentId={comment.id}
            locale={locale}
            returnPath={returnPath}
            label={labels.delete}
          />
        ) : null}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {comment.content}
      </p>
      {viewerId && report ? (
        <EntityCommentReportControl
          commentId={comment.id}
          locale={locale}
          returnPath={returnPath}
          labels={report.labels}
          reasons={report.reasons}
        />
      ) : null}
    </li>
  );
}
