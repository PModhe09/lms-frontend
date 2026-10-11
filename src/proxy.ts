import { NextResponse, type NextRequest } from "next/server";
import { OPS_MODULES, can, homeFor } from "@/lib/rbac";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const AUTH_PAGES = ["/login", "/signup"];

/**
 * Route guard for UX: sends people to the page they can use instead of letting them hit a 403
 * from the API. Not a security boundary. Every API route enforces RBAC itself.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (AUTH_PAGES.includes(pathname)) {
    return session ? to(homeFor(session.role)) : NextResponse.next();
  }
  if (!session) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (pathname === "/") return to(homeFor(session.role));

  const isBorrower = session.role === "BORROWER";
  if (pathname.startsWith("/apply") && !isBorrower) return to("/dashboard");
  if (pathname.startsWith("/dashboard")) {
    if (isBorrower) return to("/apply");
    const slug = pathname.split("/")[2];
    const opsModule = OPS_MODULES.find((m) => m.slug === slug);
    if (opsModule && !can(session.role, opsModule.permission)) return to("/403");
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the API rewrite, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
