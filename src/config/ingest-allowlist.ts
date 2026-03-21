export const INGEST_ALLOWLIST = {
  allowedCities: ["berlin", "koeln"] as const,
  allowedPlaceCategories: ["restaurants", "cafes", "bakeries", "markets"] as const,
  allowedEventCategories: ["CONCERT", "CULTURE", "COMMUNITY", "FAMILY"] as const,
  allowedSourceTypes: [
    "official_website",
    "official_venue_website",
    "official_organizer_website",
    "official_event_page",
    "trusted_manual_submission",
  ] as const,
  minimalValidation: {
    requireCity: true,
    requireTitle: true,
    requireSource: true,
    requireCategoryForProcessedItems: true,
  },
  sourceRolloutV1: {
    shared: [
      {
        key: "trusted-manual-submission",
        label: "Trusted manual submission",
        sourceType: "trusted_manual_submission",
        allowWithoutSourceUrl: true,
      },
    ],
    place: {
      berlin: [
        {
          key: "berlin-city-portal-places",
          label: "Berlin.de official place pages",
          sourceType: "official_website",
          domains: ["berlin.de"],
        },
        {
          key: "visitberlin-venues",
          label: "visitBerlin venue pages",
          sourceType: "official_venue_website",
          domains: ["visitberlin.de"],
        },
      ],
      koeln: [
        {
          key: "stadt-koeln-places",
          label: "Stadt Koeln official place pages",
          sourceType: "official_website",
          domains: ["stadt-koeln.de", "koeln.de"],
        },
        {
          key: "koeln-tourismus-venues",
          label: "Koeln Tourismus venue pages",
          sourceType: "official_venue_website",
          domains: ["koelntourismus.de"],
        },
      ],
    },
    event: {
      berlin: [
        {
          key: "berlin-city-events",
          label: "Berlin.de event pages",
          sourceType: "official_event_page",
          domains: ["berlin.de"],
        },
        {
          key: "visitberlin-events",
          label: "visitBerlin event pages",
          sourceType: "official_event_page",
          domains: ["visitberlin.de"],
        },
      ],
      koeln: [
        {
          key: "stadt-koeln-events",
          label: "Stadt Koeln event pages",
          sourceType: "official_event_page",
          domains: ["stadt-koeln.de", "koeln.de"],
        },
        {
          key: "koeln-tourismus-events",
          label: "Koeln Tourismus event pages",
          sourceType: "official_event_page",
          domains: ["koelntourismus.de"],
        },
        {
          key: "koelnmesse-events",
          label: "Koelnmesse event pages",
          sourceType: "official_event_page",
          domains: ["koelnmesse.de"],
        },
      ],
    },
  },
} as const;

type IngestEntityType = "place" | "event";
type IngestAllowlistCity = (typeof INGEST_ALLOWLIST.allowedCities)[number];
type AllowedSourceType = (typeof INGEST_ALLOWLIST.allowedSourceTypes)[number];
export type IngestSourceAllowlistEntry = {
  key: string;
  label: string;
  sourceType: AllowedSourceType;
  domains?: readonly string[];
  accountHandles?: readonly string[];
  externalIds?: readonly string[];
  allowWithoutSourceUrl?: boolean;
};

export type IngestSourceRolloutSection = {
  key: "shared" | "place.berlin" | "place.koeln" | "event.berlin" | "event.koeln";
  entries: readonly IngestSourceAllowlistEntry[];
};

type EvaluateIngestAllowlistInput = {
  entityType?: string | null;
  city?: string | null;
  category?: string | null;
  title?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sourceAccountHandle?: string | null;
  sourceExternalId?: string | null;
};

type EvaluateIngestAllowlistOptions = {
  enforceCategory?: boolean;
};

export type IngestAllowlistDecision =
  | {
      allowed: false;
      blockCode: "BLOCKED_BY_ALLOWLIST";
      reasonCode:
        | "ENTITY_TYPE_REQUIRED"
        | "CITY_REQUIRED"
        | "CITY_NOT_ALLOWED"
        | "TITLE_REQUIRED"
        | "SOURCE_REQUIRED"
        | "SOURCE_TYPE_NOT_ALLOWED"
        | "SOURCE_IDENTIFIER_REQUIRED"
        | "SOURCE_NOT_ALLOWED"
        | "CATEGORY_REQUIRED"
        | "PLACE_CATEGORY_NOT_ALLOWED"
        | "EVENT_CATEGORY_NOT_ALLOWED";
      normalizedEntityType: IngestEntityType | null;
      normalizedCity: string | null;
      normalizedCategory: string | null;
      normalizedSourceType: string | null;
      normalizedSourceHost: string | null;
      matchedSourceKey: string | null;
      matchedSourceLabel: string | null;
    }
  | {
      allowed: true;
      blockCode: null;
      reasonCode: null;
      normalizedEntityType: IngestEntityType;
      normalizedCity: string;
      normalizedCategory: string | null;
      normalizedSourceType: string | null;
      normalizedSourceHost: string | null;
      matchedSourceKey: string | null;
      matchedSourceLabel: string | null;
    };

export type IngestAllowlistFailureGroup =
  | "entity"
  | "city"
  | "title"
  | "source"
  | "category";

type RawIngestAllowlistInput = {
  entityGuess?: string | null;
  cityGuess?: string | null;
  rawText?: string | null;
  rawTitle?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sourceAccountHandle?: string | null;
  sourceExternalId?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEntityType(value: string | null | undefined): IngestEntityType | null {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "place" || normalized === "event") {
    return normalized;
  }

  return null;
}

function normalizeCity(value: string | null | undefined) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) {
    return null;
  }

  if (normalized === "koln" || normalized === "köln" || normalized === "koeln" || normalized === "cologne") {
    return "koeln";
  }

  if (normalized === "berlin") {
    return "berlin";
  }

  return normalized.replace(/\s+/g, "-");
}

export function deriveRawEventCityGuessFromText(value: string | null | undefined) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) {
    return null;
  }

  const hasBerlin = /(^|[^a-z])berlin([^a-z]|$)/.test(normalized);
  const hasKoeln =
    /(^|[^a-z])(koeln|koln|cologne)([^a-z]|$)/.test(normalized);

  if (hasBerlin === hasKoeln) {
    return null;
  }

  return hasBerlin ? "berlin" : "koeln";
}

export function deriveRawEventDatetimeTextFromText(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const matches = Array.from(normalized.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g));

  if (matches.length === 0) {
    return null;
  }

  const uniqueNormalizedDates = new Set(
    matches.map((match) => {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      return `${day}.${month}.${year}`;
    }),
  );

  if (uniqueNormalizedDates.size !== 1) {
    return null;
  }

  const timeCandidates = [
    ...Array.from(normalized.matchAll(/\b(\d{1,2}):(\d{2})\s*Uhr\b/gi)),
    ...Array.from(normalized.matchAll(/\b(\d{1,2}):(\d{2})\b/gi)),
    ...Array.from(normalized.matchAll(/\b(\d{1,2})\.(\d{2})(?!\.\d{4}\b)\b/gi)),
    ...Array.from(normalized.matchAll(/\b(\d{1,2})\s*Uhr\b/gi)),
  ];

  const uniqueNormalizedTimes = new Set(
    timeCandidates
      .map((match) => {
        const hourText = match[1];
        const minuteText = match[2] ?? "00";
        const hour = Number.parseInt(hourText ?? "", 10);
        const minute = Number.parseInt(minuteText, 10);

        if (
          Number.isNaN(hour) ||
          Number.isNaN(minute) ||
          hour < 0 ||
          hour > 23 ||
          minute < 0 ||
          minute > 59
        ) {
          return null;
        }

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      })
      .filter((time): time is string => Boolean(time)),
  );

  const normalizedDate = Array.from(uniqueNormalizedDates)[0] ?? null;
  if (!normalizedDate) {
    return null;
  }

  if (uniqueNormalizedTimes.size === 1) {
    return `${normalizedDate} ${Array.from(uniqueNormalizedTimes)[0]}`;
  }

  return normalizedDate;
}

export function deriveRawEventLocationTextFromText(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const addressMatches = Array.from(
    normalized.matchAll(
      /\b([\p{L}0-9 .,'’()/-]{3,80}?(?:str\.|straße|strasse|platz|allee|weg|gasse|ufer|ring|damm|chaussee|kai)\s+\d{1,4}[a-zA-Z]?(?:,\s*|\s+)\d{5}\s+(?:Berlin|Köln|Koeln|Koln))\b/giu,
    ),
  );

  if (addressMatches.length === 0) {
    return null;
  }

  const uniqueLocations = new Set(
    addressMatches
      .map((match) => match[1]?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean),
  );

  if (uniqueLocations.size !== 1) {
    return null;
  }

  return Array.from(uniqueLocations)[0] ?? null;
}

function normalizePlaceCategory(value: string | null | undefined) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function normalizeEventCategory(value: string | null | undefined) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || null;
}

function normalizeSourceType(value: string | null | undefined) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function normalizeSourceIdentifier(value: string | null | undefined) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function normalizeSourceHost(value: string | null | undefined) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return null;
  }

  const candidate = normalized.includes("://") ? normalized : `https://${normalized}`;

  try {
    return new URL(candidate).hostname.replace(/^www\./, "") || null;
  } catch {
    const hostname = normalized
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#:]/, 1)[0];

    return hostname || null;
  }
}

function matchesDomain(host: string | null, domain: string) {
  if (!host) {
    return false;
  }

  return host === domain || host.endsWith(`.${domain}`);
}

function getConcreteSourceAllowlistEntries(
  entityType: IngestEntityType,
  city: IngestAllowlistCity,
): readonly IngestSourceAllowlistEntry[] {
  return [
    ...INGEST_ALLOWLIST.sourceRolloutV1.shared,
    ...INGEST_ALLOWLIST.sourceRolloutV1[entityType][city],
  ];
}

function matchConcreteSourceAllowlistEntry(
  entries: readonly IngestSourceAllowlistEntry[],
  input: {
    sourceType: string | null;
    sourceHost: string | null;
    sourceAccountHandle: string | null;
    sourceExternalId: string | null;
  },
) {
  const typeEntries = entries.filter((entry) => entry.sourceType === input.sourceType);

  if (typeEntries.length === 0) {
    return {
      matchedEntry: null,
      hasTypeCandidate: false,
      requiresIdentifier: false,
    };
  }

  for (const entry of typeEntries) {
    if (
      entry.allowWithoutSourceUrl &&
      !input.sourceHost &&
      !input.sourceAccountHandle &&
      !input.sourceExternalId
    ) {
      return {
        matchedEntry: entry,
        hasTypeCandidate: true,
        requiresIdentifier: false,
      };
    }

    if (entry.domains?.some((domain) => matchesDomain(input.sourceHost, domain))) {
      return {
        matchedEntry: entry,
        hasTypeCandidate: true,
        requiresIdentifier: false,
      };
    }

    if (entry.accountHandles?.includes(input.sourceAccountHandle ?? "")) {
      return {
        matchedEntry: entry,
        hasTypeCandidate: true,
        requiresIdentifier: false,
      };
    }

    if (entry.externalIds?.includes(input.sourceExternalId ?? "")) {
      return {
        matchedEntry: entry,
        hasTypeCandidate: true,
        requiresIdentifier: false,
      };
    }
  }

  const requiresIdentifier = typeEntries.some(
    (entry) =>
      Boolean(entry.domains?.length || entry.accountHandles?.length || entry.externalIds?.length) &&
      !entry.allowWithoutSourceUrl,
  );

  return {
    matchedEntry: null,
    hasTypeCandidate: true,
    requiresIdentifier,
  };
}

export function getSourceRolloutV1Sections(): readonly IngestSourceRolloutSection[] {
  return [
    {
      key: "shared",
      entries: INGEST_ALLOWLIST.sourceRolloutV1.shared,
    },
    {
      key: "place.berlin",
      entries: INGEST_ALLOWLIST.sourceRolloutV1.place.berlin,
    },
    {
      key: "place.koeln",
      entries: INGEST_ALLOWLIST.sourceRolloutV1.place.koeln,
    },
    {
      key: "event.berlin",
      entries: INGEST_ALLOWLIST.sourceRolloutV1.event.berlin,
    },
    {
      key: "event.koeln",
      entries: INGEST_ALLOWLIST.sourceRolloutV1.event.koeln,
    },
  ];
}

export function evaluateIngestAllowlist(
  input: EvaluateIngestAllowlistInput,
  options: EvaluateIngestAllowlistOptions = {},
): IngestAllowlistDecision {
  const enforceCategory = options.enforceCategory ?? true;
  const normalizedEntityType = normalizeEntityType(input.entityType);
  const normalizedCity = normalizeCity(input.city);
  const normalizedTitle = normalizeText(input.title);
  const normalizedSourceType = normalizeSourceType(input.sourceType);
  const normalizedSourceUrl = normalizeText(input.sourceUrl);
  const normalizedSourceAccountHandle = normalizeSourceIdentifier(input.sourceAccountHandle);
  const normalizedSourceExternalId = normalizeSourceIdentifier(input.sourceExternalId);
  const normalizedSourceHost = normalizeSourceHost(normalizedSourceUrl);

  if (!normalizedEntityType) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "ENTITY_TYPE_REQUIRED",
      normalizedEntityType: null,
      normalizedCity,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  if (INGEST_ALLOWLIST.minimalValidation.requireCity && !normalizedCity) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "CITY_REQUIRED",
      normalizedEntityType,
      normalizedCity: null,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  if (
    normalizedCity &&
    !INGEST_ALLOWLIST.allowedCities.includes(
      normalizedCity as (typeof INGEST_ALLOWLIST.allowedCities)[number],
    )
  ) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "CITY_NOT_ALLOWED",
      normalizedEntityType,
      normalizedCity,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  if (INGEST_ALLOWLIST.minimalValidation.requireTitle && !normalizedTitle) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "TITLE_REQUIRED",
      normalizedEntityType,
      normalizedCity: normalizedCity ?? null,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  if (
    INGEST_ALLOWLIST.minimalValidation.requireSource &&
    !normalizedSourceType &&
    !normalizedSourceUrl
  ) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "SOURCE_REQUIRED",
      normalizedEntityType,
      normalizedCity: normalizedCity ?? null,
      normalizedCategory: null,
      normalizedSourceType: null,
      normalizedSourceHost: null,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  if (
    normalizedSourceType &&
    !INGEST_ALLOWLIST.allowedSourceTypes.includes(
      normalizedSourceType as (typeof INGEST_ALLOWLIST.allowedSourceTypes)[number],
    )
  ) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "SOURCE_TYPE_NOT_ALLOWED",
      normalizedEntityType,
      normalizedCity: normalizedCity ?? null,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  const concreteSourceMatch = getConcreteSourceAllowlistEntries(
    normalizedEntityType,
    normalizedCity as IngestAllowlistCity,
  );
  const { matchedEntry, hasTypeCandidate, requiresIdentifier } = matchConcreteSourceAllowlistEntry(
    concreteSourceMatch,
    {
      sourceType: normalizedSourceType,
      sourceHost: normalizedSourceHost,
      sourceAccountHandle: normalizedSourceAccountHandle,
      sourceExternalId: normalizedSourceExternalId,
    },
  );

  if (!matchedEntry) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode:
        hasTypeCandidate &&
        !normalizedSourceHost &&
        !normalizedSourceAccountHandle &&
        !normalizedSourceExternalId &&
        requiresIdentifier
          ? "SOURCE_IDENTIFIER_REQUIRED"
          : "SOURCE_NOT_ALLOWED",
      normalizedEntityType,
      normalizedCity: normalizedCity ?? null,
      normalizedCategory: null,
      normalizedSourceType,
      normalizedSourceHost,
      matchedSourceKey: null,
      matchedSourceLabel: null,
    };
  }

  const normalizedCategory =
    normalizedEntityType === "place"
      ? normalizePlaceCategory(input.category)
      : normalizeEventCategory(input.category);

  if (enforceCategory && INGEST_ALLOWLIST.minimalValidation.requireCategoryForProcessedItems) {
    if (!normalizedCategory) {
      return {
        allowed: false,
        blockCode: "BLOCKED_BY_ALLOWLIST",
        reasonCode: "CATEGORY_REQUIRED",
        normalizedEntityType,
        normalizedCity: normalizedCity ?? null,
        normalizedCategory: null,
        normalizedSourceType,
        normalizedSourceHost,
        matchedSourceKey: matchedEntry.key,
        matchedSourceLabel: matchedEntry.label,
      };
    }

    if (
      normalizedEntityType === "place" &&
      !INGEST_ALLOWLIST.allowedPlaceCategories.includes(
        normalizedCategory as (typeof INGEST_ALLOWLIST.allowedPlaceCategories)[number],
      )
    ) {
      return {
        allowed: false,
        blockCode: "BLOCKED_BY_ALLOWLIST",
        reasonCode: "PLACE_CATEGORY_NOT_ALLOWED",
        normalizedEntityType,
        normalizedCity: normalizedCity ?? null,
        normalizedCategory,
        normalizedSourceType,
        normalizedSourceHost,
        matchedSourceKey: matchedEntry.key,
        matchedSourceLabel: matchedEntry.label,
      };
    }

    if (
      normalizedEntityType === "event" &&
      !INGEST_ALLOWLIST.allowedEventCategories.includes(
        normalizedCategory as (typeof INGEST_ALLOWLIST.allowedEventCategories)[number],
      )
    ) {
      return {
        allowed: false,
        blockCode: "BLOCKED_BY_ALLOWLIST",
        reasonCode: "EVENT_CATEGORY_NOT_ALLOWED",
        normalizedEntityType,
        normalizedCity: normalizedCity ?? null,
        normalizedCategory,
        normalizedSourceType,
        normalizedSourceHost,
        matchedSourceKey: matchedEntry.key,
        matchedSourceLabel: matchedEntry.label,
      };
    }
  }

  return {
    allowed: true,
    blockCode: null,
    reasonCode: null,
    normalizedEntityType,
    normalizedCity: normalizedCity ?? "",
    normalizedCategory,
    normalizedSourceType,
    normalizedSourceHost,
    matchedSourceKey: matchedEntry.key,
    matchedSourceLabel: matchedEntry.label,
  };
}

export function evaluateRawIngestAllowlist(input: RawIngestAllowlistInput) {
  const derivedCityGuess =
    normalizeCity(input.cityGuess) ?? deriveRawEventCityGuessFromText(input.rawText);

  return evaluateIngestAllowlist(
    {
      entityType: input.entityGuess,
      city: derivedCityGuess,
      title: input.rawTitle,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      sourceAccountHandle: input.sourceAccountHandle,
      sourceExternalId: input.sourceExternalId,
    },
    { enforceCategory: false },
  );
}

export function buildAllowlistBlockedHandling(decision: IngestAllowlistDecision) {
  if (decision.allowed) {
    return null;
  }

  return {
    status: "FAILED" as const,
    errorMessage: "BLOCKED_BY_ALLOWLIST" as const,
  };
}

export function getAllowlistFailureGroup(
  reasonCode: Exclude<IngestAllowlistDecision["reasonCode"], null>,
): IngestAllowlistFailureGroup {
  if (reasonCode === "ENTITY_TYPE_REQUIRED") {
    return "entity";
  }

  if (reasonCode === "CITY_REQUIRED" || reasonCode === "CITY_NOT_ALLOWED") {
    return "city";
  }

  if (reasonCode === "TITLE_REQUIRED") {
    return "title";
  }

  if (
    reasonCode === "SOURCE_REQUIRED" ||
    reasonCode === "SOURCE_TYPE_NOT_ALLOWED" ||
    reasonCode === "SOURCE_IDENTIFIER_REQUIRED" ||
    reasonCode === "SOURCE_NOT_ALLOWED"
  ) {
    return "source";
  }

  return "category";
}
