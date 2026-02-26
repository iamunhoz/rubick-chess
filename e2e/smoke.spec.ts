import { expect, test } from "@playwright/test";

const shouldRun = process.env.RUN_E2E === "1";

test.describe("smoke", () => {
  test.skip(!shouldRun, "Set RUN_E2E=1 and run a dev server at http://127.0.0.1:5173");
  test("renders canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
  });
});
