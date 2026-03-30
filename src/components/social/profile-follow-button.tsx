"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type ProfileFollowButtonProps = {
  profileUserId: string;
  initialFollowing: boolean;
  labels: {
    follow: string;
    unfollow: string;
  };
};

export function ProfileFollowButton({
  profileUserId,
  initialFollowing,
  labels,
}: ProfileFollowButtonProps) {
  const router = useRouter();
  const tGuard = useTranslations("socialSafety");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      if (following) {
        const res = await fetch(
          `/api/follow?followingUserId=${encodeURIComponent(profileUserId)}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setFollowing(false);
        }
      } else {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingUserId: profileUserId }),
        });
        if (res.ok) {
          setFollowing(true);
        } else if (res.status === 429) {
          setError(tGuard("rateWaitRetry"));
        } else {
          setError(tGuard("actionUnavailable"));
        }
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button type="button" variant={following ? "outline" : "default"} disabled={pending} onClick={toggle}>
        {following ? labels.unfollow : labels.follow}
      </Button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
