import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { getGeolocation } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "./lib/supabaseAdmin";

export async function middleware(request: NextRequest) {
  console.log("Middleware processing request for:", request.nextUrl.pathname);

  // Skip middleware for certain routes
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname === "/auth/callback"
  ) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isKnownBot = /bot|crawler|spider|crawling/i.test(userAgent);
  const isGoogleBot = /Googlebot|bingbot|slurp|DuckDuckBot|Baiduspider/i.test(
    userAgent
  );

  if (isKnownBot && !isGoogleBot) {
    console.log("Blocked non-SEO bot:", userAgent);
    return NextResponse.next(); // let them pass but don't track
  }

  const res = NextResponse.next();
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const isProfileRoute = request.nextUrl.pathname.startsWith("/profile");
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

    // Redirect unauthenticated users from protected routes
    if ((isProtectedRoute || isProfileRoute) && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from login page
    if (isAuthRoute && user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const redirectPath = userData?.role === "creator" ? "/dashboard" : "/";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Restrict non-creators from accessing dashboard
    if (isProtectedRoute && user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (userData?.role !== "creator") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    // Parse user agent
    const parser = new UAParser(request.headers.get("user-agent") || "");
    const userAgent = parser.getResult();

    // Get IP address and geolocation
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const geoData = await getGeolocation(ip);

    // Track page view for all users (authenticated and guests)
    const pageView = {
      creator_id: process.env.NEXT_PUBLIC_CREATOR_UID,
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

    await supabaseAdmin.from("page_views").insert(pageView);

    // Track additional engagement events for authenticated users
    if (user) {
      const engagementEvents = [
        {
          creator_id: process.env.NEXT_PUBLIC_CREATOR_UID,
          event_type: "view",
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

      await supabaseAdmin.from("user_engagement").insert(engagementEvents);
    }
  } catch (error) {
    console.error("Middleware error:", error);
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
