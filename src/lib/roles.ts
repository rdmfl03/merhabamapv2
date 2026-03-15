import type { Role } from "@prisma/client";

export const roles = {
  user: "USER",
  businessOwner: "BUSINESS_OWNER",
  moderator: "MODERATOR",
  admin: "ADMIN",
} satisfies Record<string, Role>;

export const elevatedRoles: Role[] = [roles.moderator, roles.admin];
export const adminRoles: Role[] = [roles.admin];
