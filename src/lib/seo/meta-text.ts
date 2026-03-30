const DEFAULT_MAX = 160;

/** Single-line meta description, trimmed and length-limited (no HTML). */
export function clampMetaDescription(raw: string, max = DEFAULT_MAX): string {
  const single = raw.replace(/\s+/g, " ").trim();
  if (single.length <= max) {
    return single;
  }
  const cut = single.slice(0, max - 1).trimEnd();
  return `${cut}…`;
}
