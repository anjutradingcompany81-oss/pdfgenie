// This project uses Next.js 16's "Proxy" convention (renamed from
// Middleware — see node_modules/next/dist/docs/.../proxy.md). It runs in
// the Node.js runtime by default here, which is what lets us use the
// Auth.js `auth()` wrapper directly.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAdminArea = nextUrl.pathname.startsWith("/admin/dashboard");
  const isAdminLogin = nextUrl.pathname === "/admin/dashboard/login";
  const isUserArea =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname === "/choose-plan" ||
    nextUrl.pathname === "/auth/post-login";

  if (isAdminArea && !isAdminLogin) {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard/login", nextUrl));
    }
  }

  if (isUserArea && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/dashboard/:path*", "/choose-plan", "/auth/post-login"],
};
