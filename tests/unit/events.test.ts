import { buildEventsPath, formatEventDateRange, getBerlinDateFilter, getBerlinDateKey, getSafeExternalUrl, getLocalizedEventText } from "@/lib/events";

describe("event helpers", () => {
  it("falls back between languages for event text", () => {
    expect(getLocalizedEventText({ de: "Konzert", tr: null }, "tr")).toBe("Konzert");
    expect(getLocalizedEventText({ de: null, tr: "Konser" }, "de")).toBe("Konser");
  });

  it("builds filtered event paths", () => {
    expect(buildEventsPath("de")).toBe("/de/events");
    expect(
      buildEventsPath("tr", {
        city: "koeln",
        categories: ["BUSINESS"],
        date: "this-week",
      }),
    ).toBe("/tr/events?city=koeln&category=BUSINESS&date=this-week");
  });

  it("formats same-day event ranges compactly", () => {
    const startsAt = new Date("2026-04-19T19:00:00+02:00");
    const endsAt = new Date("2026-04-19T23:30:00+02:00");

    const formatted = formatEventDateRange("de", startsAt, endsAt);

    expect(formatted).toContain("23:30");
    expect(formatted.length).toBeGreaterThan(10);
  });

  it("keeps Berlin date keys stable across timezone-sensitive comparisons", () => {
    expect(getBerlinDateKey(new Date("2026-03-20T23:15:00+01:00"))).toBe("2026-03-20");
  });

  it("recognizes safe external urls", () => {
    expect(getSafeExternalUrl("https://example.com/tickets")).toBe("https://example.com/tickets");
    expect(getSafeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("supports event date filters", () => {
    const thisMonth = new Date();
    thisMonth.setDate(Math.max(2, thisMonth.getDate() + 2));
    const oldDate = new Date("2020-01-01T12:00:00+01:00");

    expect(getBerlinDateFilter(thisMonth, "upcoming")).toBe(true);
    expect(getBerlinDateFilter(oldDate, "upcoming")).toBe(false);
  });
});
