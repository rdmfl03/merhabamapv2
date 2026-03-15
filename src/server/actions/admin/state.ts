export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleAdminActionState: AdminActionState = {
  status: "idle",
};
