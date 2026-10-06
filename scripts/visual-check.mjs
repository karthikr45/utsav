import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4317/");
await page
  .getByText("A little garden party", { exact: true })
  .waitFor({ timeout: 60000 });
await page.screenshot({ path: "../../work/home-desktop.png", fullPage: true });
console.log("home", await page.title(), "errors", errors);
await page.goto("http://127.0.0.1:4317/login");
await page.getByRole("button", { name: "customer", exact: true }).click();
await page.getByText("Hello, Ananya.").waitFor({ timeout: 30000 });
await page.screenshot({
  path: "../../work/dashboard-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "../../work/dashboard-mobile.png",
  fullPage: true,
});
console.log(
  "dashboard width",
  await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  })),
);
await page.goto("http://127.0.0.1:4317/");
await page.getByText("A little garden party", { exact: true }).waitFor();
await page.screenshot({ path: "../../work/home-mobile.png", fullPage: true });
console.log(
  "mobile width",
  await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  })),
  "errors",
  errors,
);
await browser.close();
