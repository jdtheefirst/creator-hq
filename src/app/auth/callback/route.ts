import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/config/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code);

    // Check if user is admin and redirect accordingly
    if (session?.user && isAdmin(session.user.email)) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  // For non-admin users or if no session, redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
