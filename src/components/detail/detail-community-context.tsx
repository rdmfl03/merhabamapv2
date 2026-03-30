import { getTranslations } from "next-intl/server";

import { isWithinLastDays } from "@/lib/datetime/is-within-last-days";

const RECENT_COMMENT_DAYS = 10;

export type DetailCommunityContextPlaceProps = {
  variant: "place";
  commentCount: number;
  saveCount: number;
  publicListCount: number;
  latestCommentAt: Date | null;
};

export type DetailCommunityContextEventProps = {
  variant: "event";
  commentCount: number;
  saveCount: number;
  interestedCount: number;
  goingCount: number;
  latestCommentAt: Date | null;
};

export type DetailCommunityContextProps =
  | DetailCommunityContextPlaceProps
  | DetailCommunityContextEventProps;

function hasPlaceSignals(p: DetailCommunityContextPlaceProps): boolean {
  return (
    p.commentCount > 0 || p.saveCount > 0 || p.publicListCount > 0
  );
}

function hasEventSignals(p: DetailCommunityContextEventProps): boolean {
  return (
    p.commentCount > 0 ||
    p.saveCount > 0 ||
    p.interestedCount > 0 ||
    p.goingCount > 0
  );
}

export async function DetailCommunityContext(props: DetailCommunityContextProps) {
  if (props.variant === "place") {
    if (!hasPlaceSignals(props)) {
      return null;
    }
    const t = await getTranslations("places.detail.community");
    const showRecentHint =
      props.commentCount > 0 &&
      props.latestCommentAt != null &&
      isWithinLastDays(props.latestCommentAt, RECENT_COMMENT_DAYS);

    return (
      <div
        className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
        aria-label={t("ariaLabel")}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
          {props.commentCount > 0 ? (
            <li>{t("comments", { count: props.commentCount })}</li>
          ) : null}
          {props.saveCount > 0 ? (
            <li>{t("saves", { count: props.saveCount })}</li>
          ) : null}
          {props.publicListCount > 0 ? (
            <li>{t("publicLists", { count: props.publicListCount })}</li>
          ) : null}
        </ul>
        {showRecentHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("hintRecentComments")}</p>
        ) : null}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("footnote")}</p>
      </div>
    );
  }

  if (!hasEventSignals(props)) {
    return null;
  }

  const t = await getTranslations("events.detail.community");
  const showRecentHint =
    props.commentCount > 0 &&
    props.latestCommentAt != null &&
    isWithinLastDays(props.latestCommentAt, RECENT_COMMENT_DAYS);

  const showCityHint =
    props.commentCount > 0 ||
    props.saveCount > 0 ||
    props.interestedCount > 0 ||
    props.goingCount > 0;

  return (
    <div
      className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
      aria-label={t("ariaLabel")}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("title")}
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
        {props.interestedCount > 0 ? (
          <li>{t("interested", { count: props.interestedCount })}</li>
        ) : null}
        {props.goingCount > 0 ? (
          <li>{t("going", { count: props.goingCount })}</li>
        ) : null}
        {props.commentCount > 0 ? (
          <li>{t("comments", { count: props.commentCount })}</li>
        ) : null}
        {props.saveCount > 0 ? (
          <li>{t("saves", { count: props.saveCount })}</li>
        ) : null}
      </ul>
      {showRecentHint ? (
        <p className="mt-1 text-xs text-muted-foreground">{t("hintRecentComments")}</p>
      ) : null}
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("footnote")}</p>
    </div>
  );
}
