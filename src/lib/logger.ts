import "server-only";

import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown> | undefined;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const redactedKeys = [
  "password",
  "hashedPassword",
  "token",
  "secret",
  "authorization",
  "cookie",
  "email",
  "phone",
];

function shouldLog(level: LogLevel) {
  return levels[level] >= levels[env.LOG_LEVEL];
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        if (redactedKeys.some((entry) => key.toLowerCase().includes(entry.toLowerCase()))) {
          return [key, "[redacted]"];
        }

        return [key, sanitizeValue(nestedValue)];
      }),
    );
  }

  return value;
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    app: "merhabamap",
    env: env.APP_ENV ?? env.NODE_ENV,
    ...(meta ? { meta: sanitizeValue(meta) } : {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    emit("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta);
  },
};
