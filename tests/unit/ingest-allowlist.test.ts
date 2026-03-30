import {
  deriveRawEventDatetimeTextFromText,
  deriveRawEventCityGuessFromText,
  deriveRawEventLocationTextFromText,
  evaluateIngestAllowlist,
  evaluateRawIngestAllowlist,
} from "@/config/ingest-allowlist";

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

  it("allows trusted manual submissions for new pilot cities without city-specific domains", () => {
    const decision = evaluateIngestAllowlist({
      entityType: "event",
      city: "Essen",
      category: "COMMUNITY",
      title: "Stammtisch",
      sourceType: "trusted_manual_submission",
      sourceUrl: null,
    });

    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.normalizedCity).toBe("essen");
    }
  });

  it("derives a conservative Berlin city guess from raw event text", () => {
    expect(
      deriveRawEventCityGuessFromText(
        "Treffpunkt in Berlin-Neukoelln. Die Veranstaltung findet in Berlin statt.",
      ),
    ).toBe("berlin");
  });

  it("derives a conservative Koeln city guess from raw event text", () => {
    expect(
      deriveRawEventCityGuessFromText(
        "Die neue Verbandszentrale in Köln-Müngersdorf lädt zum Abend in Cologne ein.",
      ),
    ).toBe("koeln");
  });

  it("derives a conservative Dortmund city guess from raw event text", () => {
    expect(
      deriveRawEventCityGuessFromText("Open Air Konzert in Dortmund am Phoenix-See."),
    ).toBe("dortmund");
  });

  it("ignores ambiguous raw event text that mentions both rollout cities", () => {
    expect(
      deriveRawEventCityGuessFromText(
        "Auftakt in Berlin, Abschlussveranstaltung später in Köln.",
      ),
    ).toBeNull();
  });

  it("ignores ambiguous raw event text that mentions two pilot cities including Ruhr", () => {
    expect(
      deriveRawEventCityGuessFromText("Erster Termin in Berlin, zweiter Workshop in Dortmund."),
    ).toBeNull();
  });

  it("uses derived city guess from raw event text in raw ingest allowlist evaluation", () => {
    const decision = evaluateRawIngestAllowlist({
      entityGuess: "EVENT",
      cityGuess: null,
      rawText: "Community event in Berlin mit offenem Austausch vor Ort.",
      rawTitle: "Community event",
      sourceType: "official_event_page",
      sourceUrl: "https://www.visitberlin.de/en/event/community-night",
    });

    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.normalizedCity).toBe("berlin");
      expect(decision.matchedSourceKey).toBe("visitberlin-events");
    }
  });

  it("derives a single clear numeric event date from raw text", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "Gesucht wird ab dem 16.04.2026 ein*e Projektkoordinator*in im Rahmen des Programms.",
      ),
    ).toBe("16.04.2026");
  });

  it("ignores raw text with multiple different numeric dates", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "18.03.2026 Botschaft zum Ramadan-Fest. 17.03.2026 DITIB BDMJ Iftar 2026.",
      ),
    ).toBeNull();
  });

  it("normalizes repeated numeric date variants to one raw datetime text value", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "16.4.2026 Gesucht wird ab dem 16.04.2026 ein*e Projektkoordinator*in.",
      ),
    ).toBe("16.04.2026");
  });

  it("appends a single explicit HH:MM time to a single clear numeric date", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "Das Event findet am 16.04.2026 um 19:30 Uhr im Saal statt.",
      ),
    ).toBe("16.04.2026 19:30");
  });

  it("normalizes explicit hour-only Uhr format to HH:00", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "Beginn 16.04.2026, 19 Uhr. Einlass spaeter.",
      ),
    ).toBe("16.04.2026 19:00");
  });

  it("keeps date-only output when multiple different times appear", () => {
    expect(
      deriveRawEventDatetimeTextFromText(
        "16.04.2026 Einlass 18:00 Uhr, Beginn 19:30 Uhr.",
      ),
    ).toBe("16.04.2026");
  });

  it("derives a single clear Berlin address as raw event location text", () => {
    expect(
      deriveRawEventLocationTextFromText(
        "Türkische Gemeinde in Deutschland e.V. Obentrautstr. 72 10963 Berlin Kontakt und weitere Hinweise.",
      ),
    ).toBe("Türkische Gemeinde in Deutschland e.V. Obentrautstr. 72 10963 Berlin");
  });

  it("derives a single clear Koeln address as raw event location text", () => {
    expect(
      deriveRawEventLocationTextFromText(
        "Verband der Islamischen Kulturzentren e. V. Vogelsanger Str. 290 50825 Köln lädt ein.",
      ),
    ).toBe("Verband der Islamischen Kulturzentren e. V. Vogelsanger Str. 290 50825 Köln");
  });

  it("ignores raw text with multiple different address-like locations", () => {
    expect(
      deriveRawEventLocationTextFromText(
        "Obentrautstr. 72 10963 Berlin und Vogelsanger Str. 290 50825 Köln stehen im Text.",
      ),
    ).toBeNull();
  });

  it("ignores plain city mentions without a clear address-like location", () => {
    expect(
      deriveRawEventLocationTextFromText(
        "Community event in Berlin mit offenem Austausch vor Ort.",
      ),
    ).toBeNull();
  });
});
