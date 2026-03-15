import { getSafeNextPath } from "@/lib/auth/safe-redirects";
import { sanitizeEventReturnPath } from "@/server/actions/events/shared";
import { sanitizeReturnPath } from "@/server/actions/places/shared";

describe("navigation safety helpers", () => {
  it("normalizes unsafe next paths", () => {
    expect(getSafeNextPath("/de/profile", "de")).toBe("/de/profile");
    expect(getSafeNextPath("https://evil.example.com", "de")).toBe("/de");
    expect(getSafeNextPath("//evil.example.com", "de")).toBe("/de");
  });

  it("keeps place and event return paths locale-scoped", () => {
    expect(sanitizeReturnPath("de", "/de/places/lale-cafe-berlin")).toBe(
      "/de/places/lale-cafe-berlin",
    );
    expect(sanitizeReturnPath("de", "/tr/places/lale-cafe-berlin")).toBe("/de/places");
    expect(sanitizeEventReturnPath("tr", "/tr/events/anatolia-late-session-berlin")).toBe(
      "/tr/events/anatolia-late-session-berlin",
    );
    expect(sanitizeEventReturnPath("tr", "/de/events")).toBe("/tr/events");
  });
});
