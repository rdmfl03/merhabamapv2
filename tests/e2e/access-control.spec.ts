import { expect, test } from "@playwright/test";

import { demoAccounts, signIn } from "./helpers/auth";

test("unauthenticated users are redirected away from admin routes", async ({ page }) => {
  await page.goto("/de/admin");
  await page.waitForURL(/\/de\/auth\/signin/);
  await expect(page).toHaveURL(/next=%2Fde%2Fadmin/);
});

test("moderator can access the admin overview", async ({ page }) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.moderator.email,
    password: demoAccounts.moderator.password,
    next: "/de/admin",
  });

  await page.waitForURL(/\/de\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Moderation und Trust",
  );
});

test("business owner can access owned place management and non-owner cannot", async ({
  browser,
}) => {
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  await signIn(ownerPage, {
    locale: "de",
    email: demoAccounts.businessOwner.email,
    password: demoAccounts.businessOwner.password,
    next: "/de/business",
  });

  await ownerPage.waitForURL(/\/de\/business$/);
  await expect(ownerPage.getByText("Usta Berber Köln")).toBeVisible();

  const manageHref =
    await ownerPage.getByRole("link", { name: "Verwalten" }).first().getAttribute("href");

  expect(manageHref).toBeTruthy();

  await ownerPage.goto(manageHref!);
  await expect(ownerPage.getByRole("heading", { level: 1 })).toContainText(
    "Usta Berber Köln",
  );
  await ownerContext.close();

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();

  await signIn(userPage, {
    locale: "de",
    email: demoAccounts.user.email,
    password: demoAccounts.user.password,
    next: manageHref!,
  });

  await userPage.waitForLoadState("networkidle");
  await expect(userPage).not.toHaveURL(new RegExp(`${manageHref!.replace(/\//g, "\\/")}$`));
  await expect(userPage).toHaveURL(/\/de$/);
  await userContext.close();
});
