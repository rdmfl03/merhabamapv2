import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { listEntityComments } from "@/server/queries/comments/list-entity-comments";

import { EntityCommentForm } from "./entity-comment-form";
import { EntityCommentItem } from "./entity-comment-item";

type EntityCommentsSectionProps = {
  entityType: "place" | "event";
  entityId: string;
  locale: AppLocale;
  viewerId: string | null;
  returnPath: string;
  signInHref: string;
};

export async function EntityCommentsSection({
  entityType,
  entityId,
  locale,
  viewerId,
  returnPath,
  signInHref,
}: EntityCommentsSectionProps) {
  const [t, comments] = await Promise.all([
    getTranslations("comments"),
    listEntityComments(entityType, entityId),
  ]);

  return (
    <Card className="bg-white/90">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("empty")}
            <span className="mt-1 block text-xs">{t("emptyHint")}</span>
          </p>
        ) : (
          <ul className="divide-y-0">
            {comments.map((comment) => (
              <EntityCommentItem
                key={comment.id}
                comment={comment}
                locale={locale}
                returnPath={returnPath}
                viewerId={viewerId}
                labels={{
                  delete: t("delete"),
                  authorFallback: t("authorFallback"),
                }}
                report={
                  viewerId
                    ? {
                        labels: {
                          action: t("report.action"),
                          title: t("report.title"),
                          description: t("report.description"),
                          reasonLabel: t("report.reasonLabel"),
                          detailsLabel: t("report.detailsLabel"),
                          detailsPlaceholder: t("report.detailsPlaceholder"),
                          submit: t("report.submit"),
                          success: t("report.success"),
                          error: t("report.error"),
                          cooldown: t("report.cooldown"),
                          dailyLimit: t("report.dailyLimit"),
                        },
                        reasons: [
                          {
                            value: "INACCURATE_INFORMATION",
                            label: t("report.reasons.inaccurateInformation"),
                          },
                          { value: "DUPLICATE", label: t("report.reasons.duplicate") },
                          {
                            value: "CLOSED_OR_UNAVAILABLE",
                            label: t("report.reasons.closedOrUnavailable"),
                          },
                          {
                            value: "INAPPROPRIATE_CONTENT",
                            label: t("report.reasons.inappropriateContent"),
                          },
                          { value: "SPAM_OR_ABUSE", label: t("report.reasons.spamOrAbuse") },
                          { value: "OTHER", label: t("report.reasons.other") },
                        ],
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        )}

        <EntityCommentForm
          entityType={entityType}
          entityId={entityId}
          locale={locale}
          returnPath={returnPath}
          isAuthenticated={Boolean(viewerId)}
          signInHref={signInHref}
          labels={{
            placeholder: t("placeholder"),
            submit: t("submit"),
            signIn: t("signIn"),
            counter: t("counter"),
            success: t("success"),
            errorGeneric: t("errorGeneric"),
            errorValidation: t("errorValidation"),
          }}
        />
      </CardContent>
    </Card>
  );
}
