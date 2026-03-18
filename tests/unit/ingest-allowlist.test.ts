import { evaluateIngestAllowlist } from "@/config/ingest-allowlist";

describe("ingest allowlist source rollout v1", () => {
  it("allows Berlin events from configured event domains", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "event",
      city: "Berlin",
      category: "COMMUNITY",
      title: "Community night",
      sourceType: "official_event_page",
      sourceUrl: "https://www.visitberlin.de/en/event/community-night",
    });

    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.matchedSourceKey).toBe("visitberlin-events");
      expect(decision.normalizedSourceHost).toBe("visitberlin.de");
    }
  });

  it("allows Koeln places from configured city domains", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "place",
      city: "Köln",
      category: "cafes",
      title: "Cafe am Rhein",
      sourceType: "official_website",
      sourceUrl: "https://www.stadt-koeln.de/leben-in-koeln/freizeit-natur-sport/cafe-am-rhein",
    });

    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.matchedSourceKey).toBe("stadt-koeln-places");
      expect(decision.normalizedCity).toBe("koeln");
    }
  });

  it("blocks sources outside the v1 city rollout contract", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "event",
      city: "Berlin",
      category: "CULTURE",
      title: "Late concert",
      sourceType: "official_event_page",
      sourceUrl: "https://example.com/events/late-concert",
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reasonCode).toBe("SOURCE_NOT_ALLOWED");
      expect(decision.normalizedSourceHost).toBe("example.com");
    }
  });

  it("requires a concrete identifier when the source type is rollout-gated", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "event",
      city: "Berlin",
      category: "COMMUNITY",
      title: "Neighborhood meetup",
      sourceType: "official_event_page",
      sourceUrl: null,
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reasonCode).toBe("SOURCE_IDENTIFIER_REQUIRED");
    }
  });

  it("keeps trusted manual submissions allowed without broad domain enablement", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "place",
      city: "Berlin",
      category: "markets",
      title: "Manual market entry",
      sourceType: "trusted_manual_submission",
      sourceUrl: null,
    });

    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.matchedSourceKey).toBe("trusted-manual-submission");
    }
  });
});
