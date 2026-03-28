import type { Page } from "@playwright/test";

function requireDemoPassword() {
  const password = process.env.DEMO_ACCOUNT_PASSWORD?.trim();

  if (!password) {
    throw new Error(
      "Missing DEMO_ACCOUNT_PASSWORD for e2e auth. Set it in .env.test.local before running demo-account sign-in flows.",
    );
  }

  return password;
}

export const demoAccounts = {
  user: {
    email: "demo.user@example.com",
    password: requireDemoPassword(),
  },
  businessOwner: {
    email: "demo.business@example.com",
    password: requireDemoPassword(),
  },
  moderator: {
    email: "demo.moderator@example.com",
    password: requireDemoPassword(),
  },
  admin: {
    email: "demo.admin@example.com",
    password: requireDemoPassword(),
  },
  fresh: {
    email: "demo.fresh@example.com",
    password: requireDemoPassword(),
  },
} as const;

export async function signIn(
  page: Page,
  args: {
    locale?: "de" | "tr";
    email: string;
    password: string;
    next?: string;
  },
) {
  const locale = args.locale ?? "de";
  const next = args.next ?? `/${locale}`;
  const labels = {
    email: locale === "tr" ? "E-posta" : "E-Mail",
    password: locale === "tr" ? "Sifre" : "Passwort",
    submit: locale === "tr" ? "Giris yap" : "Anmelden",
  };

  await page.goto(`/${locale}/auth/signin?next=${encodeURIComponent(next)}`);
  await page.getByLabel(labels.email).fill(args.email);
  await page.getByLabel(labels.password).fill(args.password);
  await page.getByRole("button", { name: labels.submit }).click();
}
