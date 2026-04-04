"use client";

import { useActionState, useRef } from "react";

import { UserProfileAvatar } from "@/components/social/user-profile-avatar";
import { Button } from "@/components/ui/button";
import {
  clearProfileAvatar,
  uploadProfileAvatar,
} from "@/server/actions/user/profile-avatar-actions";
import { idleUserFormState } from "@/server/actions/user/state";
import type { AppLocale } from "@/i18n/routing";

type ProfileAvatarSettingsProps = {
  locale: AppLocale;
  username: string;
  name: string | null | undefined;
  imageUrl: string | null | undefined;
  labels: {
    title: string;
    hint: string;
    chooseFile: string;
    remove: string;
    successUpload: string;
    successClear: string;
    errors: {
      default: string;
      missing: string;
      tooLarge: string;
      invalid: string;
      saveFailed: string;
    };
  };
};

export function ProfileAvatarSettings({
  locale,
  username,
  name,
  imageUrl,
  labels,
}: ProfileAvatarSettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProfileAvatar,
    idleUserFormState,
  );
  const [clearState, clearAction, clearPending] = useActionState(
    clearProfileAvatar,
    idleUserFormState,
  );

  const uploadMessage =
    uploadState.status === "success"
      ? labels.successUpload
      : uploadState.status === "error"
        ? uploadState.message === "avatar_missing"
          ? labels.errors.missing
          : uploadState.message === "avatar_too_large"
            ? labels.errors.tooLarge
            : uploadState.message === "avatar_invalid"
              ? labels.errors.invalid
              : uploadState.message === "save_failed"
                ? labels.errors.saveFailed
                : labels.errors.default
        : null;

  const clearMessage =
    clearState.status === "success"
      ? labels.successClear
      : clearState.status === "error"
        ? labels.errors.default
        : null;

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{labels.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <UserProfileAvatar
          imageUrl={imageUrl}
          name={name}
          username={username}
          size="lg"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <form action={uploadAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={() => fileRef.current?.form?.requestSubmit()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadPending}
              onClick={() => fileRef.current?.click()}
            >
              {labels.chooseFile}
            </Button>
          </form>
          {imageUrl ? (
            <form action={clearAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost" size="sm" disabled={clearPending}>
                {labels.remove}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      {uploadMessage ? (
        <p
          className={
            uploadState.status === "success" ? "text-sm text-green-700" : "text-sm text-brand"
          }
        >
          {uploadMessage}
        </p>
      ) : null}
      {clearMessage && !uploadMessage ? (
        <p
          className={
            clearState.status === "success" ? "text-sm text-green-700" : "text-sm text-brand"
          }
        >
          {clearMessage}
        </p>
      ) : null}
    </div>
  );
}
