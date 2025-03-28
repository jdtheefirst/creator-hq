import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { getGeolocation } from "@/lib/geolocation";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Get the user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
