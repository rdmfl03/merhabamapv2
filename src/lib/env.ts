import "server-only";

import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]);
const appEnvSchema = z.enum(["development", "staging", "production"]);
const booleanStringSchema = z.enum(["true", "false"]).transform((value) => value === "true");
const integerStringSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value));
const optionalStringSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default("development"),
    APP_ENV: appEnvSchema.optional(),

    DATABASE_URL: z.string().min(1),

    AUTH_SECRET: z.string().min(32),
    AUTH_URL: optionalUrlSchema,
    AUTH_ENABLE_PASSWORD_LOGIN: booleanStringSchema.default("true"),
    AUTH_DEMO_CREDENTIALS_ENABLED: booleanStringSchema.default("false"),
    AUTH_ALLOW_CREDENTIALS_MOCK: booleanStringSchema.default("false"),
    AUTH_SIGNUP_INVITE_CODES: optionalStringSchema,

    APP_NAME: z.string().min(1).default("MerhabaMap"),
    APP_URL: z.string().url(),
    DEFAULT_LOCALE: z.enum(["de", "tr"]).default("de"),

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    READINESS_ENABLE_DB_CHECK: booleanStringSchema.default("true"),

    EMAIL_TRANSPORT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["disabled", "log", "resend"]).optional(),
    ),
    RESEND_API_KEY: optionalStringSchema,
    EMAIL_VERIFICATION_TOKEN_TTL_HOURS: integerStringSchema.default("24"),
    PASSWORD_RESET_TOKEN_TTL_MINUTES: integerStringSchema.default("60"),
    INGEST_SECRET: optionalStringSchema,

    S3_REGION: optionalStringSchema,
    S3_BUCKET: optionalStringSchema,
    S3_ENDPOINT: optionalUrlSchema,
    S3_ACCESS_KEY_ID: optionalStringSchema,
    S3_SECRET_ACCESS_KEY: optionalStringSchema,

    /** Server-only; MapTiler via /api/map-tiles proxy — same idea as RESEND_API_KEY (never NEXT_PUBLIC_*). */
    MAPTILER_API_KEY: optionalStringSchema,
    NEXT_PUBLIC_ENABLE_DEV_DEMO_UI: booleanStringSchema.default("false"),
  })
  .superRefine((value, ctx) => {
    const appEnv = value.APP_ENV ?? (value.NODE_ENV === "production" ? "production" : "development");
    const isProduction = appEnv === "production";

    if (isProduction && value.AUTH_DEMO_CREDENTIALS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_DEMO_CREDENTIALS_ENABLED must be false in production.",
        path: ["AUTH_DEMO_CREDENTIALS_ENABLED"],
      });
    }

    if (isProduction && value.AUTH_ALLOW_CREDENTIALS_MOCK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_ALLOW_CREDENTIALS_MOCK must be false in production.",
        path: ["AUTH_ALLOW_CREDENTIALS_MOCK"],
      });
    }

    if (isProduction && value.NEXT_PUBLIC_ENABLE_DEV_DEMO_UI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NEXT_PUBLIC_ENABLE_DEV_DEMO_UI must be false in production.",
        path: ["NEXT_PUBLIC_ENABLE_DEV_DEMO_UI"],
      });
    }

    if (value.EMAIL_TRANSPORT === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RESEND_API_KEY is required when EMAIL_TRANSPORT is resend.",
        path: ["RESEND_API_KEY"],
      });
    }

    if (isProduction && !value.EMAIL_TRANSPORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EMAIL_TRANSPORT must be configured in production.",
        path: ["EMAIL_TRANSPORT"],
      });
    }

  });

type ParsedEnv = z.infer<typeof envSchema>;

let cachedEnv: ParsedEnv | null = null;

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  return parsed.data;
}

export function getEnv() {
  cachedEnv ??= parseEnv();
  return cachedEnv;
}

export const env = new Proxy({} as ParsedEnv, {
  get(_target, prop: keyof ParsedEnv) {
    return getEnv()[prop];
  },
});

export function getAppEnv() {
  const runtime = getEnv();
  return runtime.APP_ENV ?? (runtime.NODE_ENV === "production" ? "production" : "development");
}

export function isProduction() {
  return getAppEnv() === "production";
}

export function isStaging() {
  return getAppEnv() === "staging";
}

export function isDevelopmentLike() {
  const appEnv = getAppEnv();
  return appEnv === "development" || appEnv === "staging";
}
