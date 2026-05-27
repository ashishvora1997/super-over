import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/matches",
  "/my-cricket",
  "/players",
  "/profile",
  "/teams",
  "/tournaments",
];

const REFRESH_TOKEN_COOKIE = "refresh_token";

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const { pathname } = request.nextUrl;

  const isAuthenticated = !!refreshToken;

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url),
    );
  }

  if (pathname === "/matches") {
    return NextResponse.redirect(
      new URL("/my-cricket?tab=matches", request.url),
    );
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/dashboard/:path*",
    "/players/:path*",
    "/teams/:path*",
    "/tournaments/:path*",
    "/my-cricket/:path*",
    "/profile/:path*",
    "/matches/:path*",
  ],
};
