export type UserFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleUserFormState: UserFormState = {
  status: "idle",
};
