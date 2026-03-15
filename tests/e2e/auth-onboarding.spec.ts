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
  await page.locator('select[name="cityId"]').selectOption({ index: 0 });
  await page.locator('input[name="interests"][value="FOOD"]').check();
  await page.getByRole("button", { name: "Weiter zu MerhabaMap" }).click();

  await page.waitForURL(/\/de\/places\?city=/);
  await expect(page).toHaveURL(/\/de\/places\?city=/);
});
