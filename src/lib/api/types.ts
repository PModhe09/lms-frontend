import type { components } from "./schema";

type S = components["schemas"];
export type AuthUser = S["AuthUser"];
export type RuleSet = S["RuleSet"];
export type RuleDef = S["RuleDef"];
export type BorrowerProfile = S["BorrowerProfile"];
export type ProfileBody = S["ProfileBody"];
export type Loan = S["Loan"];
export type LoanWithPayments = S["LoanWithPayments"];
export type Payment = S["Payment"];
export type Lead = S["Lead"];
export type LoanStatus = Loan["status"];
export type OnboardingStage = BorrowerProfile["onboardingStage"];
export type EmploymentMode = ProfileBody["employmentMode"];
