import type { RuleDef, RuleSet } from "./api/types";

/** Facts the rules run on. Same derivation as the server. */
export type Facts = {
  age?: number;
  monthlySalary?: number;
  pan?: string;
  employmentMode?: string;
};

/** Completed years between two YYYY-MM-DD dates; a birthday today counts. */
export function completedYears(dob: string, today: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  return ty - by - (hadBirthday ? 0 : 1);
}

function passes(rule: RuleDef, facts: Facts): boolean | undefined {
  switch (rule.type) {
    case "RANGE": {
      const value = facts[rule.field];
      if (value === undefined || Number.isNaN(value)) return undefined;
      return (
        (rule.min === undefined || value >= rule.min) &&
        (rule.max === undefined || value <= rule.max)
      );
    }
    case "REGEX": {
      const value = facts[rule.field];
      return value ? new RegExp(rule.pattern).test(value) : undefined;
    }
    case "NOT_IN": {
      const value = facts[rule.field];
      return value ? !rule.values.includes(value) : undefined;
    }
  }
}

/**
 * Instant hints from the server's own rule set (fetched from /api/bre/rules), so thresholds
 * are never hard-coded here. Fields not filled in yet are skipped. The server still decides.
 */
export function hintFailures(
  ruleSet: RuleSet,
  facts: Facts,
): { rule: string; field: string; message: string }[] {
  return ruleSet.rules
    .filter((rule) => passes(rule, facts) === false)
    .map((rule) => ({ rule: rule.id, field: rule.field, message: rule.message }));
}
