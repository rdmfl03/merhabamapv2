export type EntityCommentActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const idleEntityCommentActionState: EntityCommentActionState = { status: "idle" };
