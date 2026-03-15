import type { Role } from "@prisma/client";

import { roles } from "@/lib/roles";

export const permissions = {
  place: {
    save: [roles.user, roles.businessOwner, roles.moderator, roles.admin],
    report: [roles.user, roles.businessOwner, roles.moderator, roles.admin],
    claim: [roles.user, roles.businessOwner, roles.moderator, roles.admin],
    moderate: [roles.moderator, roles.admin],
    own: [roles.businessOwner, roles.moderator, roles.admin],
  },
  event: {
    save: [roles.user, roles.businessOwner, roles.moderator, roles.admin],
    report: [roles.user, roles.businessOwner, roles.moderator, roles.admin],
    moderate: [roles.moderator, roles.admin],
  },
  admin: {
    dashboard: [roles.admin, roles.moderator],
    audit: [roles.admin],
  },
} as const;

export function hasPermission(
  role: Role | null | undefined,
  allowedRoles: readonly Role[],
) {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}

export function canAccessAdmin(role: Role | null | undefined) {
  return hasPermission(role, permissions.admin.dashboard);
}

export function canReviewReports(role: Role | null | undefined) {
  return hasPermission(role, permissions.admin.dashboard);
}

export function canReviewClaims(role: Role | null | undefined) {
  return hasPermission(role, permissions.admin.dashboard);
}

export function canManageModeration(role: Role | null | undefined) {
  return hasPermission(role, permissions.place.moderate);
}

export function canAccessBusiness(role: Role | null | undefined) {
  return hasPermission(role, [roles.businessOwner]);
}

export function canManageBusinessPlace(args: {
  role: Role | null | undefined;
  isOwner: boolean;
}) {
  return args.isOwner && canAccessBusiness(args.role);
}

export function canManagePlaceVerification(role: Role | null | undefined) {
  return hasPermission(role, permissions.place.moderate);
}
