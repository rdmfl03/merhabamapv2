import { env, getAppEnv as resolveAppEnv } from "@/lib/env";

export function isDemoCredentialsEnabled() {
  const appEnv = resolveAppEnv();
  return (
    (env.AUTH_DEMO_CREDENTIALS_ENABLED || env.AUTH_ALLOW_CREDENTIALS_MOCK) &&
    appEnv !== "production"
  );
}

export function isDevDemoUiEnabled() {
  return env.NEXT_PUBLIC_ENABLE_DEV_DEMO_UI && isDemoCredentialsEnabled();
}
