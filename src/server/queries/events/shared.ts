import { Prisma } from "@prisma/client";

export const publicEventSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  slug: true,
  title: true,
  descriptionDe: true,
  descriptionTr: true,
  category: true,
  venueName: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  startsAt: true,
  endsAt: true,
  organizerName: true,
  externalUrl: true,
  imageUrl: true,
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
});

export type PublicEventRecord = Prisma.EventGetPayload<{
  select: typeof publicEventSelect;
}>;
