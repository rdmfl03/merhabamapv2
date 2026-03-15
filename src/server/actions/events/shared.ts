"use server";

export type EventActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleEventActionState: EventActionState = {
  status: "idle",
};

export function sanitizeEventReturnPath(locale: "de" | "tr", value: string) {
  return value.startsWith(`/${locale}`) ? value : `/${locale}/events`;
}
