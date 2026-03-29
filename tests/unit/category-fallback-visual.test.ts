import {
  getEventImageFallbackKey,
  getPlaceImageFallbackKey,
} from "@/lib/category-fallback-visual";

describe("category fallback visual keys", () => {
  it("maps place category slugs to visual themes", () => {
    expect(getPlaceImageFallbackKey({ category: null })).toBe("default");
    expect(getPlaceImageFallbackKey({ category: { slug: "cafes" } })).toBe("cafe");
    expect(getPlaceImageFallbackKey({ category: { slug: "mosques" } })).toBe("spiritual");
    expect(getPlaceImageFallbackKey({ category: { slug: "unknown-slug" } })).toBe("default");
  });

  it("maps event categories to visual themes", () => {
    expect(getEventImageFallbackKey("CONCERT")).toBe("concert");
    expect(getEventImageFallbackKey("RELIGIOUS")).toBe("spiritual");
    expect(getEventImageFallbackKey("BUSINESS")).toBe("business_event");
  });
});
