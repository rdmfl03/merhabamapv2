import { expect, test } from "@playwright/test";

import { demoAccounts, signIn } from "./helpers/auth";

test("authenticated user can submit a place claim", async ({ page }) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.user.email,
    password: demoAccounts.user.password,
    next: "/de/places/lale-cafe-berlin",
  });

  await page.waitForURL(/\/de\/places\/lale-cafe-berlin$/);
  await page.locator('input[name="claimantName"]').fill("Demo User");
  await page.locator('input[name="claimantEmail"]').fill("demo.user@example.com");
  await page.locator('input[name="claimantPhone"]').fill("+49 30 5559999");
  await page.locator('textarea[name="message"]').fill("E2E smoke claim for seeded place.");
  await page.getByRole("button", { name: "Claim senden" }).click();

  await expect(page.getByText("Dein Claim wurde eingereicht.")).toBeVisible();
});

test("authenticated user can submit an event report", async ({ page }) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.user.email,
    password: demoAccounts.user.password,
    next: "/de/events/business-breakfast-koeln",
  });

  await page.waitForURL(/\/de\/events\/business-breakfast-koeln$/);
  await page.locator('select[name="reason"]').selectOption("OTHER");
  await page
    .locator('textarea[name="details"]')
    .fill("E2E smoke report for moderation flow.");
  await page.getByRole("button", { name: "Meldung senden" }).click();

  await expect(page.getByText("Danke, deine Meldung wurde gespeichert.")).toBeVisible();
});
