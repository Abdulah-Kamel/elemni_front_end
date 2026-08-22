import { expect, test } from "@playwright/test";

test("landing route still renders the student landing page after moving feature ownership", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /ابدأ/i })).toBeVisible();
});

test("public and guarded student routes keep their current baseline behavior", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/teachers");
  await expect(page).toHaveURL(/\/teachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("dashboard and my-courses stay auth-guarded after moving to the dashboard feature", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/my-courses");
  await expect(page).toHaveURL(/\/login$/);
});

test("teachers route still renders after moving to the teachers feature", async ({ page }) => {
  await page.goto("/teachers");
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();
});

test("auth routes still render after moving to auth feature", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 1, name: "أهلاً بيك من تاني" }),
  ).toBeVisible();

  await page.goto("/register");
  await expect(
    page.getByRole("heading", { level: 1, name: "إنشاء حساب جديد" }),
  ).toBeVisible();

  await page.goto("/forgot-password");
  await expect(
    page.getByRole("heading", { level: 1, name: "استعادة كلمة المرور" }),
  ).toBeVisible();

  await page.goto("/reset-password?token=demo-token");
  await expect(
    page.getByRole("heading", { level: 1, name: "كلمة مرور جديدة" }),
  ).toBeVisible();
});

test("public teacher profile route still renders after moving to the teachers feature", async ({ page }) => {
  await page.goto("/teachers/ahmed-hassan");
  await expect(page).toHaveURL(/\/teachers\/ahmed-hassan$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ahmed Hassan" })).toBeVisible();
});

test("teachers becomes the canonical public teacher area", async ({ page }) => {
  await page.goto("/teachers");
  await expect(page).toHaveURL(/\/teachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();

  await page.goto("/browse-teachers");
  await expect(page).toHaveURL(/\/teachers$/);

  await page.goto("/explore/teachers/ahmed-hassan");
  await page.waitForURL((url) => url.pathname === "/teachers/ahmed-hassan");
  expect(new URL(page.url()).pathname).toBe("/teachers/ahmed-hassan");
});

test("teacher marketing moves to /for-teachers", async ({ page }) => {
  await page.goto("/for-teachers");
  await expect(page).toHaveURL(/\/for-teachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "بطّل تبيع دروسك في جروبات الواتساب" })).toBeVisible();
});

test("landing emits canonical teacher and teacher-marketing destinations", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /انضم إلينا كمعلم/ })).toHaveAttribute("href", "/for-teachers");
  await expect(page.getByRole("link", { name: "عرض جميع المدرسين" })).toHaveAttribute("href", "/teachers");
  await expect(page.locator("#subjects a").first()).toHaveAttribute("href", "/teachers");
});

test("a freshly registered student can open migrated authenticated surfaces and see canonical teacher links", async ({ page }) => {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  await page.goto("/register");
  await page.getByLabel("الاسم بالكامل").fill("طالب اختبار");
  await page.getByLabel("البريد الإلكتروني").fill(`smoke-${unique}@example.com`);
  await page.getByLabel("رقم الموبايل").fill("01123456789");
  await page.locator("#password").fill("password123");
  await page.locator("#password_confirmation").fill("password123");
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole("navigation", { name: "بوابة الطالب" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "ملخص دراستك" })).toBeVisible();
  await expect(page.locator('a[href^="/explore/teachers/"]')).toHaveCount(0);

  await page.goto("/my-courses");
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole("navigation", { name: "بوابة الطالب" })).toBeVisible();

  await page.goto("/explore");
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole("navigation", { name: "بوابة الطالب" })).toBeVisible();
  await expect(page.locator('a[href="/browse-teachers"]')).toHaveCount(0);

  await expect(page.locator('a[href^="/explore/teachers/"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/teachers/"]').first()).toBeVisible();

  await page.locator('a[href^="/courses/"]').first().click();
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole("navigation", { name: "بوابة الطالب" })).toBeVisible();
  await expect(page.locator('a[href^="/explore/teachers/"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/teachers/"]').first()).toBeVisible();
});

test("course discovery and detail routes remain guarded after moving to the courses feature", async ({ page }) => {
  await page.goto("/explore");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/courses/1");
  await expect(page).toHaveURL(/\/login$/);
});
