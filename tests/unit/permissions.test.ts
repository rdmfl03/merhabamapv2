import { canAccessAdmin, canAccessBusiness, canManageBusinessPlace, canManageModeration, canReviewClaims, canReviewReports } from "@/lib/permissions";
import { roles } from "@/lib/roles";

describe("permissions", () => {
  it("allows moderator and admin to access admin area", () => {
    expect(canAccessAdmin(roles.moderator)).toBe(true);
    expect(canAccessAdmin(roles.admin)).toBe(true);
    expect(canAccessAdmin(roles.user)).toBe(false);
  });

  it("allows only business owners into business area", () => {
    expect(canAccessBusiness(roles.businessOwner)).toBe(true);
    expect(canAccessBusiness(roles.admin)).toBe(false);
    expect(canAccessBusiness(null)).toBe(false);
  });

  it("requires ownership and role for managing business places", () => {
    expect(
      canManageBusinessPlace({ role: roles.businessOwner, isOwner: true }),
    ).toBe(true);
    expect(
      canManageBusinessPlace({ role: roles.businessOwner, isOwner: false }),
    ).toBe(false);
    expect(canManageBusinessPlace({ role: roles.user, isOwner: true })).toBe(false);
  });

  it("reuses moderation permissions for claims and reports", () => {
    expect(canReviewClaims(roles.admin)).toBe(true);
    expect(canReviewReports(roles.moderator)).toBe(true);
    expect(canManageModeration(roles.user)).toBe(false);
  });
});
