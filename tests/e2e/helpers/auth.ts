import type { Page } from "@playwright/test";

export const demoAccounts = {
  user: {
    email: "demo.user@example.com",
    password: "DemoPass!123",
  },
  businessOwner: {
    email: "demo.business@example.com",
    password: "DemoPass!123",
  },
  moderator: {
    email: "demo.moderator@example.com",
    password: "DemoPass!123",
  },
  admin: {
    email: "demo.admin@example.com",
    password: "DemoPass!123",
  },
  fresh: {
    email: "demo.fresh@example.com",
    password: "DemoPass!123",
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
