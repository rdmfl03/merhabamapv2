type SlugExistsFn = (slug: string) => Promise<boolean>;

const berlinDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function sanitizeSubmissionReturnPath(
  locale: "de" | "tr",
  returnPath: string | null | undefined,
  fallback: string,
) {
  if (!returnPath || !returnPath.startsWith(`/${locale}/`)) {
    return fallback;
  }

  return returnPath;
}

export function getSafeHttpUrl(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export function buildSlugBase(value: string) {
  const normalized = normalizeSubmissionText(value).replace(/[^a-z0-9]+/g, "-");

  return normalized || "eintrag";
}

export function normalizeSubmissionText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

export function getBerlinDateInputValue(date: Date) {
  return berlinDateFormatter.format(date);
}

export async function buildUniqueSlug(base: string, exists: SlugExistsFn) {
  let candidate = base;
  let counter = 2;

  while (await exists(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

export function parseBerlinLocalDateTime(dateInput: string, timeInput?: string | null) {
  const [year, month, day] = dateInput.split("-").map(Number);
  const [hour, minute] = (timeInput || "19:00").split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date(utcGuess));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", number>;

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const berlinAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    0,
  );

  return new Date(utcGuess + (desiredUtc - berlinAsUtc));
}
