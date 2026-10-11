import { expect, test } from "@playwright/test";

/** The spec allows slips up to 5 MB, including on hosts that cap request bodies lower (Vercel: 4.5 MB). */
test("a 4.9 MB salary slip uploads; a 5.1 MB one is refused in the browser", async ({ page }) => {
  // Unique per test even when parallel workers start in the same millisecond.
  const stamp = Date.now() + Math.floor(Math.random() * 1_000_000);
  await page.goto("/signup");
  await page.getByLabel("Email").fill(`e2e-${stamp}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/apply");

  await page.getByLabel("Full name (as on PAN)").fill(`E2E Large Slip ${stamp}`);
  await page.getByLabel("PAN", { exact: true }).fill(`LARGE${String(stamp).slice(-4)}E`);
  await page.getByLabel("Date of birth").fill("1990-02-02");
  await page.getByLabel("Monthly salary (₹)").fill("90000");
  await page.getByLabel("Employment").click();
  await page.getByRole("option", { name: "Salaried" }).click();
  await page.getByRole("button", { name: /Check eligibility/ }).click();
  await expect(page.getByRole("button", { name: /Upload your latest salary slip/ })).toBeVisible();

  const tooBig = Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.alloc(Math.floor(5.1 * 1024 * 1024)),
  ]);
  await page
    .getByLabel("Salary slip file")
    .setInputFiles({ name: "too-big.pdf", mimeType: "application/pdf", buffer: tooBig });
  await expect(page.getByText(/The limit is 5 MB/)).toBeVisible();

  const big = Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.alloc(Math.floor(4.9 * 1024 * 1024)),
  ]);
  await page
    .getByLabel("Salary slip file")
    .setInputFiles({ name: "payslip-4.9mb.pdf", mimeType: "application/pdf", buffer: big });
  await expect(page.getByRole("button", { name: /Apply for/ })).toBeVisible({ timeout: 30_000 });

  const profile = await page.request.get("/api/borrower/profile");
  const body = await profile.json();
  expect(body.onboardingStage).toBe("SLIP_UPLOADED");
  expect(body.salarySlip.size).toBeGreaterThan(4.8 * 1024 * 1024);
});
