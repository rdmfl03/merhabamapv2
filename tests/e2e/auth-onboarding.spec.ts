import { expect, test } from "@playwright/test";

import { demoAccounts, signIn } from "./helpers/auth";

test("onboarding-incomplete user is redirected and can complete onboarding", async ({
  page,
}) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.fresh.email,
    password: demoAccounts.fresh.password,
    next: "/de",
  });

  await page.waitForURL(/\/de\/onboarding$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Richte MerhabaMap auf dich aus.",
  );

  await page.locator('input[name="preferredLocale"][value="de"]').check();
  await page.locator('input[name="username"]').fill("demo_fresh");
  await page.locator('select[name="cityId"]').selectOption({ index: 0 });
  await page.getByRole("button", { name: "Weiter zu Ort-Interessen" }).click();

  await page.waitForURL(/\/de\/onboarding\/places$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Orte von Interesse");

  await page.locator('input[name="placeCategoryGroups"]').first().check();
  await page.getByRole("button", { name: "Weiter zu Event-Interessen" }).click();

  await page.waitForURL(/\/de\/onboarding\/events$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Events von Interesse");

  await page.locator('input[name="eventCategories"][value="CONCERT"]').check();
  await page.getByRole("button", { name: "Weiter zu MerhabaMap" }).click();

  await page.waitForURL(/\/de\/user\/demo_fresh/);
  await expect(page).toHaveURL(/\/de\/user\/demo_fresh/);
});
