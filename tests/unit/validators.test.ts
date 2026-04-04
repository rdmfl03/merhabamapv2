import {
  mapRegistrationZodIssuesToMessage,
  registrationSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import {
  eventReportSchema,
  eventsFilterSchema,
  parseEventsFiltersFromSearchParams,
} from "@/lib/validators/events";
import {
  parsePlacesFiltersFromSearchParams,
  placeClaimSchema,
  placeReportSchema,
  placesFilterSchema,
} from "@/lib/validators/places";
import {
  entityCommentReportSchema,
  placeCollectionReportSchema,
} from "@/lib/validators/social-content-report";
import {
  onboardingBasicsSchema,
  onboardingCategoriesSchema,
  onboardingEventCategoriesSchema,
  onboardingPlaceCategoriesSchema,
  profileUpdateSchema,
} from "@/lib/validators/user";

const cityId = "cjld2cjxh0000qzrmn831i7rn";
const placeId = "cjld2cyuq0000t3rmniod1foy";
const eventId = "cjld2d0h00001qzrmn5qx6jex";
const commentId = "cjld2d0h00002qzrmn5qx6jex";
const collectionId = "cjld2d0h00003qzrmn5qx6jex";

describe("validators", () => {
  it("validates onboarding basics without interests", () => {
    expect(
      onboardingBasicsSchema.safeParse({
        locale: "de",
        preferredLocale: "de",
        username: "valid_user",
        cityId,
      }).success,
    ).toBe(true);

    expect(
      onboardingBasicsSchema.safeParse({
        locale: "de",
        preferredLocale: "de",
        username: "ab",
        cityId,
      }).success,
    ).toBe(false);

    expect(
      onboardingBasicsSchema.safeParse({
        locale: "de",
        preferredLocale: "de",
        username: "valid_user",
        cityId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("validates onboarding place and event steps", () => {
    expect(
      onboardingPlaceCategoriesSchema.safeParse({
        locale: "de",
        placeCategoryGroups: ["dining"],
      }).success,
    ).toBe(true);

    expect(
      onboardingPlaceCategoriesSchema.safeParse({
        locale: "de",
        placeCategoryGroups: [],
      }).success,
    ).toBe(false);

    expect(
      onboardingEventCategoriesSchema.safeParse({
        locale: "de",
        eventCategories: ["CONCERT"],
      }).success,
    ).toBe(true);

    expect(
      onboardingEventCategoriesSchema.safeParse({
        locale: "de",
        eventCategories: [],
      }).success,
    ).toBe(false);

    expect(
      onboardingCategoriesSchema.safeParse({
        locale: "de",
        placeCategoryGroups: ["dining"],
        eventCategories: ["CONCERT"],
      }).success,
    ).toBe(true);
  });

  it("rejects invalid usernames in profile updates", () => {
    expect(
      profileUpdateSchema.safeParse({
        locale: "de",
        name: "Demo",
        username: "bad name",
        preferredLocale: "de",
        cityId,
        interests: ["FOOD"],
        profileVisibility: "PUBLIC",
      }).success,
    ).toBe(false);
  });

  it("enforces password confirmation during registration and reset", () => {
    expect(
      registrationSchema.safeParse({
        locale: "de",
        name: "Demo",
        email: "demo@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      }).success,
    ).toBe(true);

    expect(
      resetPasswordSchema.safeParse({
        locale: "de",
        token: "a".repeat(64),
        password: "SecurePass123",
        confirmPassword: "DifferentPass123",
      }).success,
    ).toBe(false);
  });

  it("maps registration Zod issues to stable user-facing message keys", () => {
    const shortPassword = registrationSchema.safeParse({
      locale: "de",
      email: "a@b.de",
      password: "short",
      confirmPassword: "short",
    });
    expect(shortPassword.success).toBe(false);
    if (!shortPassword.success) {
      expect(mapRegistrationZodIssuesToMessage(shortPassword.error.issues)).toBe("password_too_short");
    }

    const badEmail = registrationSchema.safeParse({
      locale: "de",
      email: "not-email",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });
    expect(badEmail.success).toBe(false);
    if (!badEmail.success) {
      expect(mapRegistrationZodIssuesToMessage(badEmail.error.issues)).toBe("email_invalid");
    }

    const needsUpper = registrationSchema.safeParse({
      locale: "de",
      email: "a@b.de",
      password: "securepass123",
      confirmPassword: "securepass123",
    });
    expect(needsUpper.success).toBe(false);
    if (!needsUpper.success) {
      expect(mapRegistrationZodIssuesToMessage(needsUpper.error.issues)).toBe("password_needs_uppercase");
    }

    const mismatch = registrationSchema.safeParse({
      locale: "de",
      email: "a@b.de",
      password: "SecurePass123",
      confirmPassword: "SecurePass124",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mapRegistrationZodIssuesToMessage(mismatch.error.issues)).toBe("password_mismatch");
    }
  });

  it("validates claim and report payloads", () => {
    expect(
      placeClaimSchema.safeParse({
        locale: "de",
        placeId,
        returnPath: "/de/places/lale-cafe-berlin",
        claimantName: "Demo Owner",
        claimantEmail: "owner@example.com",
      }).success,
    ).toBe(true);

    expect(
      placeReportSchema.safeParse({
        locale: "de",
        placeId,
        returnPath: "/de/places/lale-cafe-berlin",
        reason: "OTHER",
      }).success,
    ).toBe(true);

    expect(
      eventReportSchema.safeParse({
        locale: "de",
        eventId,
        returnPath: "/de/events/anatolia-late-session-berlin",
        reason: "INVALID_REASON",
      }).success,
    ).toBe(false);

    expect(
      entityCommentReportSchema.safeParse({
        locale: "de",
        commentId,
        returnPath: "/de/places/foo",
        reason: "SPAM_OR_ABUSE",
        details: "  ",
      }).success,
    ).toBe(true);

    expect(
      placeCollectionReportSchema.safeParse({
        locale: "tr",
        collectionId,
        returnPath: "/tr/collections/abc",
        reason: "OTHER",
      }).success,
    ).toBe(true);
  });

  it("allows only supported event filter values", () => {
    expect(eventsFilterSchema.safeParse({ date: "this-week" }).success).toBe(true);
    expect(eventsFilterSchema.safeParse({ date: "tomorrow" }).success).toBe(false);
  });

  it("parses event filters leniently so one bad param does not drop the rest", () => {
    const parsed = parseEventsFiltersFromSearchParams({
      city: "berlin",
      category: "not-a-real-category",
      date: "this-month",
    });
    expect(parsed.city).toBe("berlin");
    expect(parsed.categories).toBeUndefined();
    expect(parsed.date).toBe("this-month");
  });

  it("normalizes array search params from Next.js", () => {
    const parsed = parseEventsFiltersFromSearchParams({
      city: ["koeln", "berlin"],
    });
    expect(parsed.city).toBe("koeln");
  });

  it("parses place filters leniently so one bad param does not drop the rest", () => {
    const parsed = parsePlacesFiltersFromSearchParams({
      city: "koeln",
      sort: "invalid-sort",
      category: "cafe",
    });
    expect(parsed.city).toBe("koeln");
    expect(parsed.categories).toEqual(["cafe"]);
    expect(parsed.sort).toBeUndefined();
  });

  it("normalizes place filter array search params from Next.js", () => {
    const parsed = parsePlacesFiltersFromSearchParams({
      city: ["koeln", "berlin"],
      q: ["baklava", "test"],
    });
    expect(parsed.city).toBe("koeln");
    expect(parsed.q).toBe("baklava");
  });

  it("accepts reserved city=all for nationwide listing", () => {
    expect(parsePlacesFiltersFromSearchParams({ city: "all" }).city).toBe("all");
    expect(parseEventsFiltersFromSearchParams({ city: "all" }).city).toBe("all");
  });

  it("collects repeated category params for places and events", () => {
    expect(
      parsePlacesFiltersFromSearchParams({
        category: ["cafes", "restaurants"],
      }).categories,
    ).toEqual(["cafes", "restaurants"]);
    expect(
      parseEventsFiltersFromSearchParams({
        category: ["CONCERT", "CULTURE"],
      }).categories,
    ).toEqual(["CONCERT", "CULTURE"]);
  });

  it("rejects unsupported place sort in strict schema but lenient parser ignores it", () => {
    expect(placesFilterSchema.safeParse({ sort: "bogus" }).success).toBe(false);
    expect(parsePlacesFiltersFromSearchParams({ sort: "bogus" }).sort).toBeUndefined();
  });
});
