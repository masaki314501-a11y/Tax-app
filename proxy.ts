import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Proxy context では next/headers が使えないため、req.cookies で直接読む
  const sessionCookie =
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("next-auth.session-token")
  const hasSession = !!sessionCookie

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isDashboard =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/income") ||
    request.nextUrl.pathname.startsWith("/expenses") ||
    request.nextUrl.pathname.startsWith("/deductions") ||
    request.nextUrl.pathname.startsWith("/tax") ||
    request.nextUrl.pathname.startsWith("/csv") ||
    request.nextUrl.pathname.startsWith("/scan")

  if (!hasSession && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
