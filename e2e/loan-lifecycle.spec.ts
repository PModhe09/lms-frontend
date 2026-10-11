import { expect, test, type Page } from "@playwright/test";

// Seeded staff accounts (lms-backend/src/seed.ts).
const STAFF = {
  sanction: { email: "sanction@lms.dev", password: "Sanction@123" },
  disbursement: { email: "disbursement@lms.dev", password: "Disburse@123" },
  collection: { email: "collection@lms.dev", password: "Collect@123" },
  sales: { email: "sales@lms.dev", password: "Sales@123" },
  admin: { email: "admin@lms.dev", password: "Admin@123" },
};

const PDF = {
  name: "salary-slip.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n% e2e slip\n"),
};

async function login(page: Page, who: { email: string; password: string }) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(dashboard|apply)/);
}

/** Opens the queue row for this borrower and returns its row/card. */
function rowFor(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

test("borrower applies; sanction, disbursement and collection take the loan to CLOSED", async ({
  page,
}) => {
  const stamp = Date.now();
  const name = `E2E Borrower ${stamp}`;
  const pan = `EEEEE${String(stamp).slice(-4)}E`;

  // 1. Borrower signs up; ineligible details are refused with the server's reasons.
  await page.goto("/signup");
  await page.getByLabel("Email").fill(`e2e-${stamp}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/apply");

  await page.getByLabel("Full name (as on PAN)").fill(name);
  await page.getByLabel("PAN", { exact: true }).fill(pan);
  await page.getByLabel("Date of birth").fill("2012-01-01");
  await page.getByLabel("Monthly salary (₹)").fill("60000");
  await page.getByLabel("Employment").click();
  await page.getByRole("option", { name: "Salaried" }).click();
  await expect(page.getByText("Age must be between 23 and 50").first()).toBeVisible(); // client hint
  await page.getByRole("button", { name: /Check eligibility/ }).click();
  await expect(page.getByText("Not eligible yet")).toBeVisible(); // server 422

  // 2. Fixes DOB and passes.
  await page.getByLabel("Date of birth").fill("1994-05-20");
  await page.getByRole("button", { name: /Check eligibility/ }).click();

  // 3. Uploads a slip.
  await expect(page.getByRole("button", { name: /Upload your latest salary slip/ })).toBeVisible();
  await page.getByLabel("Salary slip file").setInputFiles(PDF);

  // 4. Chooses amount and tenure, sees the live total, applies.
  await expect(page.getByRole("button", { name: /Apply for/ })).toBeVisible();
  const amount = page.getByRole("slider").first();
  await amount.focus();
  await page.keyboard.press("Home"); // ₹50,000
  const tenure = page.getByRole("slider").nth(1);
  await tenure.focus();
  await page.keyboard.press("End"); // 365 days → interest ₹6,000 exactly
  await expect(page.getByText("₹56,000.00")).toBeVisible();
  await page.getByRole("button", { name: "Apply for ₹50,000" }).click();
  await expect(page.getByText("Under review")).toBeVisible();

  // 5. Sanction approves.
  await login(page, STAFF.sanction);
  await page.goto("/dashboard/sanction");
  await rowFor(page, name).getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Loan sanctioned")).toBeVisible();

  // 6. Disbursement releases funds.
  await login(page, STAFF.disbursement);
  await page.goto("/dashboard/disbursement");
  await rowFor(page, name).getByRole("button", { name: "Disburse" }).click();
  await page.getByRole("button", { name: "Confirm disbursement" }).click();
  await expect(page.getByText("Marked as disbursed")).toBeVisible();

  // 7. Collection: a partial payment, then the rest; the loan closes itself.
  await login(page, STAFF.collection);
  await page.goto("/dashboard/collection");
  await rowFor(page, name).getByRole("button", { name: "Record payment" }).click();
  await page.getByLabel("UTR number").fill(`UTRA${stamp}`);
  await page.getByLabel("Amount (₹)").fill("20000");
  await page.getByRole("dialog").getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Payment recorded")).toBeVisible();
  await expect(rowFor(page, name)).toContainText("₹36,000.00");

  await rowFor(page, name).getByRole("button", { name: "Record payment" }).click();
  await page.getByLabel("UTR number").fill(`UTRB${stamp}`);
  await page.getByRole("dialog").getByRole("button", { name: "Record payment" }).click(); // defaults to outstanding
  await expect(rowFor(page, name)).toHaveCount(0); // closed loans leave the queue
});

test("RBAC: a sales executive cannot open the sanction module", async ({ page }) => {
  await login(page, STAFF.sales);
  await expect(page.getByRole("link", { name: "Sanction" })).toHaveCount(0);
  await page.goto("/dashboard/sanction");
  await expect(page).toHaveURL(/\/403$/);
  const res = await page.request.get("/api/ops/sanction/loans");
  expect(res.status()).toBe(403); // the API refuses too, not just the UI
});

test("admin sees every module @mobile", async ({ page }) => {
  await login(page, STAFF.admin);
  for (const name of ["Sales", "Sanction", "Disbursement", "Collection"]) {
    await expect(
      page.getByRole("navigation", { name: "Modules" }).getByRole("link", { name }),
    ).toBeVisible();
  }
});
