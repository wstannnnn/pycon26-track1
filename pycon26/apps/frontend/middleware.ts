import { NextResponse, type NextRequest } from "next/server";

import { authCookieName } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has(authCookieName);

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
