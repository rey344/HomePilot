import { expect, test } from "@playwright/test";

test.describe("Inputs drive outputs", () => {
  test("change income and recalculate → budget summary updates", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /HomePilot/i })).toBeVisible();

    await page.getByRole("button", { name: /Calculate affordability/i }).click();
    await expect(page.getByText(/50\/30\/20|Monthly housing cost/i)).toBeVisible();

    const needsBudget = page.getByText(/Needs \(50%\)/).locator("..");
    await expect(needsBudget).toContainText("$");

    await page.getByLabel(/Monthly take-home/i).fill("4000");
    await page.getByRole("button", { name: /Calculate affordability/i }).click();

    await expect(page.getByText(/Results are for the scenario/)).toBeVisible();
    await expect(needsBudget).toContainText("2,000");
  });

  test("invalid input (income empty) shows error on Calculate", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/Monthly take-home/i).fill("");
    await page.getByRole("button", { name: /Calculate affordability/i }).click();
    await expect(page.getByText(/Fix errors below|Monthly take-home income must be/i)).toBeVisible();
  });
});
