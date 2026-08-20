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

test("dashboard and my-courses stay auth-guarded after moving to the dashboard feature", async ({ page }) => {
  await page.goto("/ar/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/ar/my-courses");
  await expect(page).toHaveURL(/\/login$/);
});

test("browse teachers route still renders after moving to the teachers feature", async ({ page }) => {
  await page.goto("/browse-teachers");
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();
});

test("public teacher profile route still renders after moving to the teachers feature", async ({ page }) => {
  await page.goto("/teachers/ahmed-hassan");
  await expect(page).toHaveURL(/\/teachers\/ahmed-hassan$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ahmed Hassan" })).toBeVisible();
});

test("course discovery and detail routes remain guarded after moving to the courses feature", async ({ page }) => {
  await page.goto("/explore");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/courses/1");
  await expect(page).toHaveURL(/\/login$/);
});
