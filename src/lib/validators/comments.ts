import { z } from "zod";

/** Matches Prisma `EntityComment.content` and UI copy. */
export const ENTITY_COMMENT_MAX_LENGTH = 500;

const entityTypeSchema = z.enum(["place", "event"]);

export const createEntityCommentSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
  content: z
    .string()
    .max(ENTITY_COMMENT_MAX_LENGTH)
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
});

export const deleteEntityCommentSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  commentId: z.string().min(1),
});
