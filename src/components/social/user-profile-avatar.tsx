import Image from "next/image";

import { cn } from "@/lib/utils";

function avatarInitials(name: string | null | undefined, username: string): string {
  const n = (name?.trim() || username).trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

export type UserProfileAvatarProps = {
  imageUrl: string | null | undefined;
  name: string | null | undefined;
  username: string;
  size: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const frameClass: Record<UserProfileAvatarProps["size"], string> = {
  sm: "h-10 w-10 min-h-10 min-w-10 text-sm",
  md: "h-12 w-12 min-h-12 min-w-12 text-base",
  lg: "h-28 w-28 min-h-28 min-w-28 text-2xl sm:h-32 sm:w-32 sm:min-h-32 sm:min-w-32",
  xl: "h-36 w-36 min-h-36 min-w-36 text-3xl",
};

const pixelSize: Record<UserProfileAvatarProps["size"], number> = {
  sm: 40,
  md: 48,
  lg: 128,
  xl: 144,
};

export function UserProfileAvatar({
  imageUrl,
  name,
  username,
  size,
  className,
}: UserProfileAvatarProps) {
  const px = pixelSize[size];
  const label = name?.trim() || username;
  const initialsText = avatarInitials(name, username);

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60",
          frameClass[size],
          className,
        )}
      >
        <Image
          src={imageUrl}
          alt={label}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand ring-1 ring-border/60",
        frameClass[size],
        className,
      )}
      aria-label={label}
    >
      <span className="select-none" aria-hidden>
        {initialsText}
      </span>
    </div>
  );
}
