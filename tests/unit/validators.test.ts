import { resetPasswordSchema, registrationSchema } from "@/lib/validators/auth";
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
import { onboardingSchema, profileUpdateSchema } from "@/lib/validators/user";

const cityId = "cjld2cjxh0000qzrmn831i7rn";
const placeId = "cjld2cyuq0000t3rmniod1foy";
const eventId = "cjld2d0h00001qzrmn5qx6jex";

describe("validators", () => {
  it("validates onboarding payloads with at least one interest", () => {
    expect(
      onboardingSchema.safeParse({
        locale: "de",
        preferredLocale: "de",
        cityId,
        interests: ["FOOD"],
      }).success,
    ).toBe(true);

    expect(
      onboardingSchema.safeParse({
        locale: "de",
        preferredLocale: "de",
        cityId,
        interests: [],
      }).success,
    ).toBe(false);
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
    expect(parsed.category).toBeUndefined();
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
    expect(parsed.category).toBe("cafe");
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

  it("rejects unsupported place sort in strict schema but lenient parser ignores it", () => {
    expect(placesFilterSchema.safeParse({ sort: "bogus" }).success).toBe(false);
    expect(parsePlacesFiltersFromSearchParams({ sort: "bogus" }).sort).toBeUndefined();
  });
});
