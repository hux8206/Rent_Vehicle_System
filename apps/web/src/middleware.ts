import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  // Protect Admin Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "0") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Partner Routes (/partner/*)
  if (pathname.startsWith("/partner")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "1") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Customer Booking History (/customer/bookings) and Profile (/profile)
  if (pathname.startsWith("/customer/bookings") || pathname.startsWith("/profile")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/partner/:path*",
    "/customer/bookings/:path*",
    "/profile/:path*",
  ],
};

