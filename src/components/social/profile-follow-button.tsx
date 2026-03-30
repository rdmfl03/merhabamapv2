"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
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
        }
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant={following ? "outline" : "default"} disabled={pending} onClick={toggle}>
      {following ? labels.unfollow : labels.follow}
    </Button>
  );
}
