import { test, expect } from "@playwright/test";
test("marketplace, city filters and responsive layout", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "For moments worth celebrating." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "A little garden party", exact: true })
    .waitFor();
  await page.getByLabel("Select city", { exact: true }).selectOption("Nellore");
  await page
    .getByRole("button", { name: "A birthday full of wonder", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "A birthday full of wonder", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A birthday full of wonder",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("customer creates a persisted event through the UI", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /^customer$/i }).click();
  await expect(
    page.getByRole("heading", { name: "Hello, Ananya." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New celebration", exact: true })
    .click();
  const name = `Browser celebration ${Date.now()}`;
  await page.getByLabel("Give your event a name", { exact: true }).fill(name);
  await page.getByLabel("Event date", { exact: true }).fill("2032-12-20");
  await page
    .getByRole("button", { name: "Create my celebration", exact: true })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
