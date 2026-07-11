import { expect, test } from "@playwright/test";

test("submitting the form returns a real weather-grounded preparedness plan", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("City").fill("Mumbai");
  await page.getByLabel("Household size").fill("3");
  await page.getByLabel("Language").selectOption("English");
  await page.getByRole("button", { name: "Get preparedness plan" }).click();

  await expect(page.getByText("Emergency checklist")).toBeVisible({ timeout: 45_000 });

  await expect(page.getByRole("heading", { name: /Mumbai/ })).toBeVisible();
  await expect(page.getByText(/Severity:/i)).toBeVisible();
  await expect(page.getByText("Travel advisory")).toBeVisible();
  await expect(page.getByText("Safety recommendations")).toBeVisible();
});
