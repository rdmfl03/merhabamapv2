"use client";

import { useActionState } from "react";

import { deleteEntityComment } from "@/server/actions/comments/delete-entity-comment";
import {
  idleEntityCommentActionState,
  type EntityCommentActionState,
} from "@/server/actions/comments/entity-comment-state";
import { Button } from "@/components/ui/button";

type CommentDeleteControlProps = {
  commentId: string;
  locale: "de" | "tr";
  returnPath: string;
  label: string;
};

export function CommentDeleteControl({
  commentId,
  locale,
  returnPath,
  label,
}: CommentDeleteControlProps) {
  const [state, formAction, pending] = useActionState(
    deleteEntityComment,
    idleEntityCommentActionState as EntityCommentActionState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <input type="hidden" name="commentId" value={commentId} />
      <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs" disabled={pending}>
        {label}
      </Button>
      {state.status === "error" ? (
        <span className="sr-only" role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
