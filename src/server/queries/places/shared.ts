import { Prisma } from "@prisma/client";

export const publicPlaceSelect = Prisma.validator<Prisma.PlaceSelect>()({
  id: true,
  slug: true,
  name: true,
  descriptionDe: true,
  descriptionTr: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  phone: true,
  websiteUrl: true,
  openingHoursJson: true,
  images: true,
  verificationStatus: true,
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      icon: true,
    },
  },
});

export type PublicPlaceRecord = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelect;
}>;
