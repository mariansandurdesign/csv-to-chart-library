import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("all seven charts render and export self-contained SVG images", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your data. A clearer story." }),
  ).toBeVisible();
  await page.getByLabel("Image format").selectOption("svg");
  for (const name of [
    "Bar",
    "Line",
    "Area",
    "Pie",
    "Donut",
    "Scatter",
    "Radar",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.locator(".chart-container svg.recharts-surface"),
    ).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download chart" }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    const svg = await readFile((await download.path())!, "utf8");
    expect(svg).toContain("A year of growing connections");
    expect(svg).toContain("<path");
    expect(svg).not.toContain("<script");
  }
  expect(errors).toEqual([]);
});

test("PNG download is a real high-resolution image", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download chart" }).click();
  const download = await downloaded;
  const png = await readFile((await download.path())!);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.readUInt32BE(16)).toBeGreaterThan(1000);
  expect(png.readUInt32BE(20)).toBeGreaterThan(600);
  expect(png.length).toBeGreaterThan(10_000);
});

test("import, edit, undo, add/delete and CSV export work together", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload CSV file").setInputFiles({
    name: "sales.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Month,Revenue,Cost\nJan,10,4\nFeb,20,8\nMar,30,12"),
  });
  await expect(page.getByRole("status")).toContainText("3 rows imported");
  await expect(page.locator(".insight").first()).toContainText("60");
  const cell = page.getByLabel("Row 1, Revenue", { exact: true });
  await cell.fill("100");
  await cell.press("Enter");
  await expect(page.locator(".insight").first()).toContainText("150");
  await page.getByRole("button", { name: "Undo last data change" }).click();
  await expect(cell).toHaveValue("10");
  await page.getByRole("button", { name: "Add row" }).click();
  await expect(
    page.getByLabel("Row 4, Revenue", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Row 4, Month", { exact: true }).fill("Apr");
  await page.getByLabel("Row 4, Month", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Delete row 2", exact: true }).click();
  await expect(page.getByLabel("Row 2, Month", { exact: true })).toHaveValue(
    "Mar",
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const csv = await readFile((await (await downloaded).path())!, "utf8");
  expect(csv).toContain("Jan,10,4");
  expect(csv).toContain("Apr,,");
  expect(csv).not.toContain("Feb");
});

test("invalid imports preserve data and unsupported chart values are explained", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload CSV file").setInputFiles({
    name: "broken.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Name,Value\nA,1,extra"),
  });
  await expect(page.locator(".notice[role=alert]")).toContainText("more cells");
  await expect(page.getByLabel("Row 1, Organic", { exact: true })).toHaveValue(
    "2400",
  );
  await page.getByLabel("Row 1, Organic", { exact: true }).fill("-100");
  await page.getByLabel("Row 1, Organic", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Pie", exact: true }).click();
  await expect(
    page.getByText("This chart needs nonnegative values.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download chart" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Line", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download chart" }),
  ).toBeEnabled();
});

test("appearance controls, cell escape, help dialog and narrow screen work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByLabel("Chart title", { exact: true })
    .fill("Our team’s progress");
  await expect(page.locator(".chart-heading h2")).toHaveText(
    "Our team’s progress",
  );
  await page.getByRole("button", { name: "Coast palette" }).click();
  await expect(
    page.getByRole("button", { name: "Coast palette" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("switch", { name: "Legend", exact: true }).click();
  await expect(page.locator(".chart-legend")).toHaveCount(0);
  const cell = page.getByLabel("Row 1, Organic", { exact: true });
  await cell.fill("999");
  await cell.press("Escape");
  await expect(cell).toHaveValue("2400");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
