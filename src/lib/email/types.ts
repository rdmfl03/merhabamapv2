export type EmailAddress = string | string[];

export type EmailPayload = {
  template: string;
  to: EmailAddress;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
};

export type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  provider: "log" | "resend" | "disabled";
  providerMessageId?: string;
};
