export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleAuthActionState: AuthActionState = {
  status: "idle",
};
