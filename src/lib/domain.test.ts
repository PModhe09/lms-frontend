import { describe, expect, it } from "vitest";
import type { RuleSet } from "./api/types";
import { completedYears, hintFailures } from "./bre";
import { formatINR } from "./format";
import { simpleInterestPaise } from "./loan-math";

// Same data the server serves from GET /api/bre/rules (v1).
const RULES: RuleSet = {
  version: 1,
  rules: [
    {
      id: "AGE",
      type: "RANGE",
      field: "age",
      min: 23,
      max: 50,
      message: "Age must be between 23 and 50",
    },
    { id: "SALARY", type: "RANGE", field: "monthlySalary", min: 25000, message: "Salary too low" },
    {
      id: "PAN",
      type: "REGEX",
      field: "pan",
      pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$",
      message: "PAN format is invalid",
    },
    {
      id: "EMPLOYMENT",
      type: "NOT_IN",
      field: "employmentMode",
      values: ["UNEMPLOYED"],
      message: "No",
    },
  ],
};

describe("hintFailures", () => {
  const today = "2026-10-10";
  it.each([
    ["2003-10-10", []],
    ["2003-10-11", ["AGE"]],
    ["1976-10-11", []],
    ["1975-10-10", ["AGE"]],
  ])("dob %s", (dob, expected) => {
    expect(hintFailures(RULES, { age: completedYears(dob, today) }).map((f) => f.rule)).toEqual(
      expected,
    );
  });

  it("checks salary, PAN and employment boundaries", () => {
    expect(hintFailures(RULES, { monthlySalary: 24_999 }).map((f) => f.rule)).toEqual(["SALARY"]);
    expect(hintFailures(RULES, { monthlySalary: 25_000 })).toEqual([]);
    expect(hintFailures(RULES, { pan: "ABCDE1234F" })).toEqual([]);
    expect(hintFailures(RULES, { pan: "ABCD1234F" }).map((f) => f.rule)).toEqual(["PAN"]);
    expect(hintFailures(RULES, { employmentMode: "UNEMPLOYED" }).map((f) => f.rule)).toEqual([
      "EMPLOYMENT",
    ]);
  });

  it("skips fields that are not filled in", () => {
    expect(hintFailures(RULES, {})).toEqual([]);
  });
});

describe("simpleInterestPaise (matches the server)", () => {
  it.each([
    [5_000_000, 30, 49_315],
    [50_000_000, 365, 6_000_000],
    [10_000_000, 100, 328_767],
    [5_000_000, 73, 120_000],
  ])("%i paise × %i days", (principal, days, expected) => {
    expect(simpleInterestPaise(principal, days)).toBe(expected);
  });
});

it("formats INR with Indian grouping", () => {
  expect(formatINR(10_000_000)).toBe("₹1,00,000.00");
});
