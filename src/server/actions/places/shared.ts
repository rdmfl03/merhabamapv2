export type PlaceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idlePlaceActionState: PlaceActionState = {
  status: "idle",
};

export function sanitizeReturnPath(locale: "de" | "tr", value: string) {
  return value.startsWith(`/${locale}`) ? value : `/${locale}/places`;
}
