/**
 * Eine Zeile für UI/Maps: Straße + PLZ + Ort, ohne PLZ/Ort zu wiederholen,
 * wenn die Straßenzeile sie schon enthält (häufig bei importierten Adressen).
 */
export function formatDisplayAddress(args: {
  streetLine: string | null | undefined;
  postalCode: string | null | undefined;
  cityLabel: string;
}): string {
  const street = args.streetLine?.trim() ?? "";
  const pc = args.postalCode?.trim() ?? "";
  const city = args.cityLabel.trim();

  if (!street) {
    if (pc && city) {
      return `${pc} ${city}`;
    }
    return city || pc;
  }

  const lower = street.toLowerCase();
  const pcInStreet = pc.length > 0 && lower.includes(pc.toLowerCase());
  const cityInStreet = city.length > 0 && lower.includes(city.toLowerCase());

  if (pcInStreet && cityInStreet) {
    return street;
  }
  if (pcInStreet && !cityInStreet && city) {
    return `${street}, ${city}`;
  }
  if (!pcInStreet && pc && city) {
    return `${street}, ${pc} ${city}`;
  }
  if (!pcInStreet && pc) {
    return `${street}, ${pc}`;
  }
  if (city && !cityInStreet) {
    return `${street}, ${city}`;
  }
  return street;
}
