export type SubmissionActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  submitted?: {
    label: string;
    citySlug: string;
  };
};

export const idleSubmissionActionState: SubmissionActionState = {
  status: "idle",
};
