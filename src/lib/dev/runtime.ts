import { env, getAppEnv as resolveAppEnv } from "@/lib/env";

function isLocalHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export function isDemoCredentialsEnabled() {
  const appEnv = resolveAppEnv();
  return (
    (env.AUTH_DEMO_CREDENTIALS_ENABLED || env.AUTH_ALLOW_CREDENTIALS_MOCK) &&
    appEnv !== "production"
  );
}

export function isDevDemoUiEnabled() {
  return (
    env.NEXT_PUBLIC_ENABLE_DEV_DEMO_UI &&
    isDemoCredentialsEnabled() &&
    isLocalHttpUrl(env.APP_URL) &&
    (!env.AUTH_URL || isLocalHttpUrl(env.AUTH_URL))
  );
}
