import { describe, expect, it } from "vitest";
import { homeFor, modulesFor } from "./rbac";

describe("modulesFor", () => {
  it("admin sees every module, executives see only their own", () => {
    expect(modulesFor("ADMIN").map((m) => m.slug)).toEqual([
      "sales",
      "sanction",
      "disbursement",
      "collection",
    ]);
    expect(modulesFor("SANCTION").map((m) => m.slug)).toEqual(["sanction"]);
    expect(modulesFor("BORROWER")).toEqual([]);
  });
});

describe("homeFor", () => {
  it("sends borrowers to the portal and staff to the dashboard", () => {
    expect(homeFor("BORROWER")).toBe("/apply");
    expect(homeFor("COLLECTION")).toBe("/dashboard");
  });
});
