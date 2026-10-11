// Copy of the backend permission map (lms-backend/src/domain/rbac.ts). Used only to shape the UI:
// which modules show in the sidebar and which buttons render. The API enforces the real rules.
import type { components } from "./api/schema";

export type Role = components["schemas"]["AuthUser"]["role"];

export const Permission = {
  BORROWER_PORTAL: "BORROWER_PORTAL",
  LEADS_READ: "LEADS_READ",
  SANCTION_READ: "SANCTION_READ",
  SANCTION_DECIDE: "SANCTION_DECIDE",
  DISBURSEMENT_READ: "DISBURSEMENT_READ",
  DISBURSEMENT_EXECUTE: "DISBURSEMENT_EXECUTE",
  COLLECTION_READ: "COLLECTION_READ",
  COLLECTION_RECORD: "COLLECTION_RECORD",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const OPS: readonly Permission[] = [
  Permission.LEADS_READ,
  Permission.SANCTION_READ,
  Permission.SANCTION_DECIDE,
  Permission.DISBURSEMENT_READ,
  Permission.DISBURSEMENT_EXECUTE,
  Permission.COLLECTION_READ,
  Permission.COLLECTION_RECORD,
];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  ADMIN: OPS,
  SALES: [Permission.LEADS_READ],
  SANCTION: [Permission.SANCTION_READ, Permission.SANCTION_DECIDE],
  DISBURSEMENT: [Permission.DISBURSEMENT_READ, Permission.DISBURSEMENT_EXECUTE],
  COLLECTION: [Permission.COLLECTION_READ, Permission.COLLECTION_RECORD],
  BORROWER: [Permission.BORROWER_PORTAL],
};

export const can = (role: Role, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission);

export type OpsModule = {
  slug: "sales" | "sanction" | "disbursement" | "collection";
  label: string;
  permission: Permission;
};

/** Dashboard modules in sidebar order. A module is visible when the role holds its read permission. */
export const OPS_MODULES: readonly OpsModule[] = [
  { slug: "sales", label: "Sales", permission: Permission.LEADS_READ },
  { slug: "sanction", label: "Sanction", permission: Permission.SANCTION_READ },
  { slug: "disbursement", label: "Disbursement", permission: Permission.DISBURSEMENT_READ },
  { slug: "collection", label: "Collection", permission: Permission.COLLECTION_READ },
];

export const modulesFor = (role: Role) => OPS_MODULES.filter((m) => can(role, m.permission));

/** Where a user lands after login, and where proxy.ts sends them from pages they cannot use. */
export const homeFor = (role: Role) => (role === "BORROWER" ? "/apply" : "/dashboard");
