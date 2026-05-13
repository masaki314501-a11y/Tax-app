import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/income") ||
    request.nextUrl.pathname.startsWith("/expenses") ||
    request.nextUrl.pathname.startsWith("/deductions") ||
    request.nextUrl.pathname.startsWith("/tax") ||
    request.nextUrl.pathname.startsWith("/csv") ||
    request.nextUrl.pathname.startsWith("/scan")

  if (!session && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
