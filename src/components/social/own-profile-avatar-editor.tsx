"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { UserProfileAvatar } from "@/components/social/user-profile-avatar";
import { uploadProfileAvatar } from "@/server/actions/user/profile-avatar-actions";
import { idleUserFormState } from "@/server/actions/user/state";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type OwnProfileAvatarEditorProps = {
  locale: AppLocale;
  username: string;
  name: string | null | undefined;
  imageUrl: string | null | undefined;
  avatarClassName?: string;
  editAriaLabel: string;
  errorLabels: {
    default: string;
    missing: string;
    tooLarge: string;
    invalid: string;
    saveFailed: string;
  };
};

export function OwnProfileAvatarEditor({
  locale,
  username,
  name,
  imageUrl,
  avatarClassName,
  editAriaLabel,
  errorLabels,
}: OwnProfileAvatarEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(uploadProfileAvatar, idleUserFormState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const errMsg =
    state.status === "error"
      ? state.message === "avatar_missing"
        ? errorLabels.missing
        : state.message === "avatar_too_large"
          ? errorLabels.tooLarge
          : state.message === "avatar_invalid"
            ? errorLabels.invalid
            : state.message === "save_failed"
              ? errorLabels.saveFailed
              : errorLabels.default
      : null;

  return (
    <div className={cn("relative shrink-0", avatarClassName)}>
      <UserProfileAvatar
        imageUrl={imageUrl}
        name={name}
        username={username}
        size="lg"
        className="sm:mt-1"
      />
      <form
        action={action}
        className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1"
        aria-busy={pending}
      >
        <input type="hidden" name="locale" value={locale} />
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={() => inputRef.current?.form?.requestSubmit()}
        />
        <button
          type="button"
          disabled={pending}
          aria-label={editAriaLabel}
          onClick={() => inputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-white text-foreground shadow-md transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      </form>
      {errMsg ? (
        <p className="mt-2 max-w-[11rem] text-xs text-brand" role="alert">
          {errMsg}
        </p>
      ) : null}
    </div>
  );
}
