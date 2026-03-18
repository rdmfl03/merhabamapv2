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
} as const;

type IngestEntityType = "place" | "event";

type EvaluateIngestAllowlistInput = {
  entityType?: string | null;
  city?: string | null;
  category?: string | null;
  title?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
};

type EvaluateIngestAllowlistOptions = {
  enforceCategory?: boolean;
};

export type IngestAllowlistDecision =
  | {
      allowed: true;
      blockCode: null;
      reasonCode: null;
      normalizedEntityType: IngestEntityType;
      normalizedCity: string;
      normalizedCategory: string | null;
      normalizedSourceType: string | null;
    }
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
        | "CATEGORY_REQUIRED"
        | "PLACE_CATEGORY_NOT_ALLOWED"
        | "EVENT_CATEGORY_NOT_ALLOWED";
      normalizedEntityType: IngestEntityType | null;
      normalizedCity: string | null;
      normalizedCategory: string | null;
      normalizedSourceType: string | null;
    };

type RawIngestAllowlistInput = {
  entityGuess?: string | null;
  cityGuess?: string | null;
  rawTitle?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
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

  if (!normalizedEntityType) {
    return {
      allowed: false,
      blockCode: "BLOCKED_BY_ALLOWLIST",
      reasonCode: "ENTITY_TYPE_REQUIRED",
      normalizedEntityType: null,
      normalizedCity,
      normalizedCategory: null,
      normalizedSourceType,
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
  };
}

export function evaluateRawIngestAllowlist(input: RawIngestAllowlistInput) {
  return evaluateIngestAllowlist(
    {
      entityType: input.entityGuess,
      city: input.cityGuess,
      title: input.rawTitle,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
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
