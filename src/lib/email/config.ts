import "server-only";

import { env, isDevelopmentLike } from "@/lib/env";

export const emailConfig = {
  from: "MerhabaMap Auth <auth@merhabamap.com>",
  replyTo: "info@merhabamap.com",
};

export function getEmailTransport() {
  if (env.EMAIL_TRANSPORT) {
    return env.EMAIL_TRANSPORT;
  }

  return isDevelopmentLike() ? "log" : "disabled";
}
