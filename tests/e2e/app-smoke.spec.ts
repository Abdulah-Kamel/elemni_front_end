import { expect, test } from "@playwright/test";

test("landing route still renders the student landing page after moving feature ownership", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /ابدأ/i })).toBeVisible();
});

test("public and guarded student routes keep their current baseline behavior", async ({ page }) => {
  await page.goto("/ar/");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/ar/browse-teachers");
  await expect(page).toHaveURL(/\/browse-teachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();

  await page.goto("/ar/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
