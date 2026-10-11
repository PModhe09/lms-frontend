"use client";

import { createContext, useContext, type ReactNode } from "react";
import { can, type Permission, type Role } from "@/lib/rbac";

const RoleContext = createContext<Role | null>(null);

export function RoleProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

/** Whether to render a control. The API makes the real decision on every call. */
export function useCan(permission: Permission): boolean {
  const role = useContext(RoleContext);
  return role !== null && can(role, permission);
}
