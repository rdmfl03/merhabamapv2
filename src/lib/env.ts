import "server-only";

import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]);
const appEnvSchema = z.enum(["development", "staging", "production"]);
const booleanStringSchema = z.enum(["true", "false"]).transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default("development"),
    APP_ENV: appEnvSchema.optional(),

    DATABASE_URL: z.string().min(1),

    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url().optional(),
    AUTH_DEMO_CREDENTIALS_ENABLED: booleanStringSchema.default(false),
    AUTH_ALLOW_CREDENTIALS_MOCK: booleanStringSchema.default(false),

    APP_NAME: z.string().min(1).default("MerhabaMap"),
    APP_URL: z.string().url(),
    DEFAULT_LOCALE: z.enum(["de", "tr"]).default("de"),

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    READINESS_ENABLE_DB_CHECK: booleanStringSchema.default(true),

    S3_REGION: z.string().min(1).optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),

    NEXT_PUBLIC_MAP_PROVIDER: z.enum(["osm", "mapbox"]).default("osm"),
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
    NEXT_PUBLIC_ENABLE_DEV_DEMO_UI: booleanStringSchema.default(false),
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
