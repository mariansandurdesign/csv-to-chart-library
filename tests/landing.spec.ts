import { expect, test } from "@playwright/test";

test("landing preview switches chart types and opens the selected editor", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good data deserves a great chart." }),
  ).toBeVisible();
  await expect(page.locator(".demo-chart svg.recharts-surface")).toBeVisible();
  await page.getByRole("button", { name: "Line", exact: true }).click();
  await expect(page.locator(".recharts-line-curve").first()).toBeVisible();
  await page.getByRole("link", { name: "Open line chart editor" }).click();
  await expect(page).toHaveURL(/\/charts\/line\/?$/);
  await expect(
    page.getByRole("heading", { name: "Line chart", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Paste CSV" })).toBeVisible();
  await page.getByRole("link", { name: "Plotroom home" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test("all chart links resolve directly to their static editor routes", async ({
  page,
}) => {
  for (const name of [
    "bar",
    "line",
    "area",
    "pie",
    "donut",
    "scatter",
    "radar",
  ]) {
    await page.goto(`/charts/${name}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`^${name} chart$`, "i") }),
    ).toBeVisible();
    await expect(
      page.locator(".chart-container svg.recharts-surface"),
    ).toBeVisible();
  }
});

test("mobile landing supports theme, FAQ, and create-chart navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator(".landing-page")).toHaveClass(/light/);
  await page.getByText("What happens to my data?", { exact: true }).click();
  await expect(
    page.getByText("Your data is processed entirely in this browser tab.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Create a chart", exact: true }).click();
  await expect(page).toHaveURL(/\/charts\/?$/);
  await expect(page.getByRole("tab", { name: "Paste CSV" })).toBeVisible();
});
