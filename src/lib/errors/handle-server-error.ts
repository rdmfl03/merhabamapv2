import "server-only";

import { isAppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";

export function handleServerError(error: unknown, context: string) {
  if (isAppError(error)) {
    logger.warn(context, {
      errorCode: error.code,
      statusCode: error.statusCode,
      message: error.message,
    });

    return {
      message: error.expose ? error.message : "Request failed.",
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  logger.error(context, {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : { message: "Unknown error" },
  });

  return {
    message: "Internal server error.",
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
  };
}
