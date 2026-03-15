export type BusinessActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleBusinessActionState: BusinessActionState = {
  status: "idle",
};
