import { expect, test } from "@playwright/test";

import { demoAccounts, signIn } from "./helpers/auth";

test("user can unsave and re-save a place from the detail page", async ({ page }) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.user.email,
    password: demoAccounts.user.password,
    next: "/de/places/nar-lokantasi-berlin",
  });

  await page.waitForURL(/\/de\/places\/nar-lokantasi-berlin$/);
  await page.getByRole("button", { name: "Gespeichert" }).click();
  await expect(page.getByRole("button", { name: "Speichern" })).toBeVisible();

  await page.goto("/de/saved/places");
  await expect(page.getByText("Nar Lokantasi Berlin")).toHaveCount(0);

  await page.goto("/de/places/nar-lokantasi-berlin");
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("button", { name: "Gespeichert" })).toBeVisible();
});

test("user can unsave and re-save an event from the detail page", async ({ page }) => {
  await signIn(page, {
    locale: "de",
    email: demoAccounts.user.email,
    password: demoAccounts.user.password,
    next: "/de/events/anatolia-late-session-berlin",
  });

  await page.waitForURL(/\/de\/events\/anatolia-late-session-berlin$/);
  await page.getByRole("button", { name: "Gespeichert" }).click();
  await expect(page.getByRole("button", { name: "Speichern" })).toBeVisible();

  await page.goto("/de/saved/events");
  await expect(page.getByText("Anatolia Late Session Berlin")).toHaveCount(0);

  await page.goto("/de/events/anatolia-late-session-berlin");
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("button", { name: "Gespeichert" })).toBeVisible();
});
