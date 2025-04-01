import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { getGeolocation } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  console.log("Middleware processing request for:", request.nextUrl.pathname);

  // Skip middleware for auth-related routes
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname === "/auth/callback"
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = await createClient();

  // Get the user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const toProfile = request.nextUrl.pathname.startsWith("/dashboard/profile");

  // Prevent infinite redirect loop for profile page
  if (toProfile && session) {
    if (
      request.nextUrl.searchParams.get("redirectedFrom") ===
      "/dashboard/profile"
    ) {
      return NextResponse.next(); // Allow access to the page
    }
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    if (redirectedFrom !== "/login") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from login page
  if (isAuthRoute && session) {
    console.log("Redirecting to dashboard - session exists for auth route");
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()
      .throwOnError();

    const redirectPath = userData?.role === "creator" ? "/dashboard" : "/";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Restrict non-creators from dashboard access
  if (isProtectedRoute && session) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()
      .throwOnError();

    if (userData?.role !== "creator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Parse user agent
  const parser = new UAParser(request.headers.get("user-agent") || "");
  const userAgent = parser.getResult();

  // Get IP address and geolocation
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const geoData = await getGeolocation(ip);

  // Track page view for all users (authenticated and guests)
  const pageView = {
    creator_id: session?.user?.id || null,
    page_path: request.nextUrl.pathname,
    user_agent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    ip_address: ip,
    country: geoData?.country || "Unknown",
    country_code: geoData?.countryCode || "XX",
    region: geoData?.region || "Unknown",
    city: geoData?.city || "Unknown",
    timezone: geoData?.timezone || "Unknown",
    latitude: geoData?.lat || null,
    longitude: geoData?.lon || null,
    device_type: userAgent.device.type || "desktop",
    browser: userAgent.browser.name || "unknown",
    os: userAgent.os.name || "unknown",
    session_id: request.cookies.get("session_id")?.value,
  };

  await supabase.from("page_views").insert(pageView);

  // Track additional engagement events for authenticated users
  if (session) {
    const engagementEvents = [
      {
        creator_id: session.user.id,
        event_type: "page_view",
        page_path: request.nextUrl.pathname,
        metadata: {
          referrer: request.headers.get("referer"),
          ip: ip,
          country: geoData?.country || "Unknown",
          country_code: geoData?.countryCode || "XX",
          region: geoData?.region || "Unknown",
          city: geoData?.city || "Unknown",
          timezone: geoData?.timezone || "Unknown",
          device: userAgent.device,
          browser: userAgent.browser,
          os: userAgent.os,
        },
      },
    ];

    await supabase.from("user_engagement").insert(engagementEvents);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (to avoid tracking API calls)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
