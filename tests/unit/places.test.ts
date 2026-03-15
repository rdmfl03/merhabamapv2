import { buildPlacesPath, getLocalizedText, getPlaceImage, getVerificationTone, parseOpeningHours } from "@/lib/places";

describe("places helpers", () => {
  it("falls back to the other locale when localized text is missing", () => {
    expect(getLocalizedText({ de: "Hallo", tr: null }, "tr", "fallback")).toBe("Hallo");
    expect(getLocalizedText({ de: null, tr: "Merhaba" }, "de", "fallback")).toBe("Merhaba");
    expect(getLocalizedText({ de: null, tr: null }, "de", "fallback")).toBe("fallback");
  });

  it("parses valid opening hours and ignores malformed data", () => {
    expect(
      parseOpeningHours('[{"day":"Mon","open":"09:00","close":"18:00"}]'),
    ).toEqual([{ day: "Mon", open: "09:00", close: "18:00" }]);
    expect(parseOpeningHours("not-json")).toEqual([]);
  });

  it("returns the first place image when available", () => {
    expect(getPlaceImage(["https://example.com/a.jpg", "https://example.com/b.jpg"])).toBe(
      "https://example.com/a.jpg",
    );
    expect(getPlaceImage([])).toBeNull();
  });

  it("builds filtered places paths", () => {
    expect(buildPlacesPath("de")).toBe("/de/places");
    expect(buildPlacesPath("tr", { city: "berlin", q: "cafe" })).toBe(
      "/tr/places?city=berlin&q=cafe",
    );
  });

  it("maps trust statuses to UI tones", () => {
    expect(getVerificationTone("VERIFIED")).toBe("verified");
    expect(getVerificationTone("CLAIMED")).toBe("claimed");
    expect(getVerificationTone("UNVERIFIED")).toBe("default");
  });
});
