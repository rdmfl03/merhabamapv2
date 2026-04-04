export type UserFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Path without locale prefix, e.g. `/user/jane` — used after onboarding (client navigation). */
  redirectTo?: string;
};

export const idleUserFormState: UserFormState = {
  status: "idle",
};
