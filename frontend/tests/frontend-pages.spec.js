import { test, expect } from "@playwright/test";

const publicPages = [
  "/",
  "/about",
  "/products",
  "/services",
  "/industries",
  "/projects",
  "/project-gallery",
  "/knowledge",
  "/quote",
  "/contact",
  "/ups-calculator",
  "/battery-calculator",
  "/three-phase-ups",
  "/ai-power-assistant",
  "/portal/login",
  "/support/amc-request",
];

test.describe("Public frontend pages", () => {
  for (const path of publicPages) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response).not.toBeNull();
      expect(response.status()).toBeLessThan(400);
    });
  }
});

test("customer dashboard redirects when unauthenticated", async ({
  page,
}) => {
  await page.goto("/portal/dashboard");

  await expect(page).toHaveURL(/\/portal\/login/);
});

test("customer equipment redirects when unauthenticated", async ({
  page,
}) => {
  await page.goto("/portal/equipment");

  await expect(page).toHaveURL(/\/portal\/login/);
});

test("customer service history redirects when unauthenticated", async ({
  page,
}) => {
  await page.goto("/portal/service-history");

  await expect(page).toHaveURL(/\/portal\/login/);
});

test("admin dashboard redirects when unauthenticated", async ({
  page,
}) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/portal\/login/);
});