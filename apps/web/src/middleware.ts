import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes requiring active authentication session
const PROTECTED_ROUTES = [
  "/dashboard",
  "/index",
  "/routes",
  "/airlines",
  "/booking-windows",
  "/data-quality",
  "/backtesting",
  "/sources",
  "/collection",
  "/audit",
  "/settings",
  "/api-management"
];

// Routes requiring ADMIN role
const ADMIN_ONLY_ROUTES = [
  "/settings",
  "/api-management"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if requested path is a protected route
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rtapip_token")?.value;
  const role = request.cookies.get("rtapip_role")?.value?.toUpperCase();

  // 1. If unauthenticated, redirect immediately to public landing page "/"
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth_required", "1");
    // Return 307 Temporary Redirect to prevent client/browser cache of protected redirects
    return NextResponse.redirect(url);
  }

  // 2. Role-based route enforcement
  const isAdminOnly = ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminOnly && role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("forbidden", "admin_required");
    return NextResponse.redirect(url);
  }

  // Allow authenticated request to proceed
  const response = NextResponse.next();
  // Set cache control headers to prevent bfcache of authenticated pages after logout
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/index/:path*",
    "/routes/:path*",
    "/airlines/:path*",
    "/booking-windows/:path*",
    "/data-quality/:path*",
    "/backtesting/:path*",
    "/sources/:path*",
    "/collection/:path*",
    "/audit/:path*",
    "/settings/:path*",
    "/api-management/:path*"
  ]
};
