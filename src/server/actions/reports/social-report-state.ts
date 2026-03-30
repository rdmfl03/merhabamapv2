export type SocialReportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleSocialReportActionState: SocialReportActionState = {
  status: "idle",
};
