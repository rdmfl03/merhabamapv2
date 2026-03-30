"use client";

import { Link } from "@/i18n/navigation";
import type { FollowListUserRow } from "@/server/queries/social/follow-graph";

import { ProfileFollowButton } from "./profile-follow-button";

type UserFollowListRowProps = {
  row: FollowListUserRow;
  viewerLoggedIn: boolean;
  labels: {
    follow: string;
    unfollow: string;
  };
};

export function UserFollowListRow({ row, viewerLoggedIn, labels }: UserFollowListRowProps) {
  const primary = row.name?.trim() || `@${row.username}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
      <Link
        href={`/user/${encodeURIComponent(row.username)}`}
        className="min-w-0 flex-1 hover:opacity-90"
      >
        <p className="truncate font-medium text-foreground">{primary}</p>
        {row.name?.trim() ? (
          <p className="truncate text-xs text-muted-foreground">@{row.username}</p>
        ) : null}
      </Link>
      {viewerLoggedIn && !row.isViewer ? (
        <ProfileFollowButton
          profileUserId={row.id}
          initialFollowing={row.viewerFollows}
          labels={labels}
        />
      ) : null}
    </li>
  );
}
