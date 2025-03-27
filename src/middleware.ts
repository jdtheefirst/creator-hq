import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/config/admin";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Ensure session is properly retrieved
  await supabase.auth.getUser(); // Ensures session is restored
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("Middleware session:", session);
  console.log("Middleware email:", session?.user?.email);
  console.log(
    "Middleware isAdmin:",
    session?.user?.email && isAdmin(session.user.email)
  );
  console.log("Request Path:", req.nextUrl.pathname);

  // If session is still loading, allow Next.js to handle it
  if (session === null) {
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is logged in but not an admin and trying to access dashboard
  if (session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const userEmail = session.user.email;
    if (!isAdmin(userEmail)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
