export function getSafeNextPath(value: string, locale: string) {
  if (!value.startsWith("/")) {
    return `/${locale}`;
  }

  if (value.startsWith("//")) {
    return `/${locale}`;
  }

  return value;
}
