import "server-only";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./rbac";

export const SESSION_COOKIE = "lms_token";

const ROLES: readonly Role[] = [
  "ADMIN",
  "SALES",
  "SANCTION",
  "DISBURSEMENT",
  "COLLECTION",
  "BORROWER",
];

export type Session = { userId: string; role: Role };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(value);
}

/**
 * Verifies the signature, not just decodes: a forged token with role ADMIN must not even
 * render the admin shell. The API still re-checks every request; this is UX only.
 */
export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const role = payload.role as Role;
    if (!payload.sub || !ROLES.includes(role)) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}

/** Session for server components and layouts. */
export async function getSession(): Promise<Session | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
