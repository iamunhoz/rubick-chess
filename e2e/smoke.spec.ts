import { expect, test } from "@playwright/test";

test.describe.skip("smoke", () => {
  test("renders canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
  });
});
