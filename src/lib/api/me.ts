import "server-only";
import { cookies } from "next/headers";
import type { components } from "./schema";
import { SESSION_COOKIE } from "../session";

export type AuthUser = components["schemas"]["AuthUser"];

/** Server-side fetch of the current user, straight to the API with the caller's cookie. */
export async function fetchMe(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const origin = process.env.API_ORIGIN ?? "http://localhost:4000";
  const res = await fetch(`${origin}/api/auth/me`, {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as AuthUser) : null;
}
