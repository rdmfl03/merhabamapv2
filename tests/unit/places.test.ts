import {
  buildPlacesPath,
  computeCategoryAdjustedScore,
  computeRatingConfidence,
  computePlaceScore,
  getCategoryKey,
  getTopPlaces,
  getLocalizedText,
  getPlaceImage,
  getPlaceScoreRatingCount,
  getVerificationTone,
  parseOpeningHours,
} from "@/lib/places";

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

  it("computes a rating-weighted place score from display summary fields", () => {
    expect(
      computePlaceScore({
        displayRatingValue: 4.6,
        displayRatingCount: 99,
        ratingSourceCount: 2,
      }),
    ).toBeCloseTo(4.6 * Math.log10(100));
  });

  it("falls back to legacy rating inputs for score calculation", () => {
    expect(
      computePlaceScore({
        legacyRatingValue: 4.2,
        legacyRatingCount: 24,
      }),
    ).toBeCloseTo(4.2 * Math.log10(25));
    expect(
      getPlaceScoreRatingCount({
        legacyRatingValue: 4.2,
        legacyRatingCount: 24,
      }),
    ).toBe(24);
  });

  it("returns zero score when no usable rating signal exists", () => {
    expect(
      computePlaceScore({
        displayRatingValue: null,
        displayRatingCount: null,
        ratingSourceCount: null,
      }),
    ).toBe(0);
    expect(getPlaceScoreRatingCount({})).toBe(0);
  });

  it("normalizes place categories to stable ranking keys", () => {
    expect(getCategoryKey({ category: { slug: "restaurants" } })).toBe("restaurant");
    expect(getCategoryKey({ category: { slug: "cafes" } })).toBe("cafe");
    expect(getCategoryKey({ category: { slug: "mosques" } })).toBe("mosque");
    expect(getCategoryKey({ category: { slug: "markets" } })).toBe("shop");
    expect(getCategoryKey({})).toBe("default");
  });

  it("boosts smaller important categories through category-adjusted score", () => {
    const baseScore = computePlaceScore({
      displayRatingValue: 4.2,
      displayRatingCount: 24,
      ratingSourceCount: 1,
    });

    expect(
      computeCategoryAdjustedScore({
        category: { slug: "mosques" },
        displayRatingValue: 4.2,
        displayRatingCount: 24,
        ratingSourceCount: 1,
      }),
    ).toBeCloseTo(baseScore / 0.6);
    expect(
      computeCategoryAdjustedScore({
        category: { slug: "markets" },
        displayRatingValue: 4.2,
        displayRatingCount: 24,
        ratingSourceCount: 1,
      }),
    ).toBeCloseTo(baseScore / 0.8);
  });

  it("computes low rating confidence when rating counts are missing", () => {
    expect(computeRatingConfidence({})).toEqual({
      value: 0,
      level: "low",
    });
  });

  it("computes a medium confidence value from rating count", () => {
    const confidence = computeRatingConfidence({
      displayRatingValue: 4.7,
      displayRatingCount: 99,
      ratingSourceCount: 2,
    });

    expect(confidence.value).toBeCloseTo(Math.min(1, Math.log10(100) / 3));
    expect(confidence.level).toBe("medium");
  });

  it("caps rating confidence at high for very large rating counts", () => {
    const confidence = computeRatingConfidence({
      displayRatingValue: 4.7,
      displayRatingCount: 9999,
      ratingSourceCount: 2,
    });

    expect(confidence.value).toBe(1);
    expect(confidence.level).toBe("high");
  });

  it("returns top places with non-low confidence and enough ratings", () => {
    const topPlaces = getTopPlaces(
      [
        {
          id: "a",
          displayRatingValue: 4.8,
          displayRatingCount: 40,
          ratingSourceCount: 2,
        },
        {
          id: "b",
          displayRatingValue: 4.9,
          displayRatingCount: 3,
          ratingSourceCount: 1,
        },
        {
          id: "c",
          displayRatingValue: 4.5,
          displayRatingCount: 80,
          ratingSourceCount: 2,
        },
      ],
      2,
    );

    expect(topPlaces).toHaveLength(2);
    expect(topPlaces.map((place) => place.id)).toEqual(["c", "a"]);
  });
});
