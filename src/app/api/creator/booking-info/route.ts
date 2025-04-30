import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const creatorId = new URL(req.url).searchParams.get("creatorId");
  const { success } = await secureRatelimit(req);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const [availability, blocked, bookings] = await Promise.all([
    supabaseAdmin
      .from("creator_availability")
      .select("day_of_week, start_time, end_time")
      .eq("creator_id", creatorId)
      .eq("is_available", true),

    supabaseAdmin
      .from("creator_blocked_dates")
      .select("start_date, end_date, reason")
      .eq("creator_id", creatorId),

    supabaseAdmin
      .from("bookings")
      .select("client_name, booking_date, duration_minutes, status")
      .eq("creator_id", creatorId)
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true }),
  ]);

  return NextResponse.json({
    availability: availability.data,
    blockedDates: blocked.data,
    bookings: bookings.data,
  });
}
