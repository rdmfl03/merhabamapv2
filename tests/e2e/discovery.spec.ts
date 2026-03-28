import { expect, test } from "@playwright/test";

test("@smoke localized public discovery pages load", async ({ page }) => {
  await page.goto("/de");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Türkische Orte",
  );

  await page.goto("/de/places");
  await expect(page.getByText("Nar Lokantasi Berlin")).toBeVisible();

  await page.goto("/de/events");
  await expect(page.getByText("Anatolia Late Session Berlin")).toBeVisible();

  await page.goto("/de/cities/map?city=berlin");
  await expect(page.getByText("Nar Lokantasi Berlin")).toBeVisible();
});

test("@smoke turkish locale routes render turkish auth copy", async ({ page }) => {
  await page.goto("/tr/auth/signin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "MerhabaMap hesabiniza giris yapin.",
  );
  await expect(page.getByRole("button", { name: "Giris yap" })).toBeVisible();
});
