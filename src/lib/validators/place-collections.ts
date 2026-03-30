import { z } from "zod";

export const placeCollectionVisibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);

export const createPlaceCollectionSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "title_required").max(80)),
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => (s == null ? "" : String(s).trim()))
    .pipe(z.string().max(300)),
  visibility: placeCollectionVisibilitySchema,
});

export const updatePlaceCollectionSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  collectionId: z.string().min(1),
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "title_required").max(80)),
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => (s == null ? "" : String(s).trim()))
    .pipe(z.string().max(300)),
  visibility: placeCollectionVisibilitySchema,
});

export const deletePlaceCollectionSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  collectionId: z.string().min(1),
});

export const placeCollectionMembershipSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  collectionId: z.string().min(1),
  placeId: z.string().min(1),
});
