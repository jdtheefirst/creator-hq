import { secureRatelimit } from "@/lib/limit";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const creatorId = new URL(req.url).searchParams.get("creatorId");
  const { success } = await secureRatelimit(req);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!success || userError || !user) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const [availability, blocked, bookings] = await Promise.all([
    supabase
      .from("creator_availability")
      .select("day_of_week, start_time, end_time")
      .eq("creator_id", user.id)
      .eq("is_available", true),

    supabase
      .from("creator_blocked_dates")
      .select("start_date, end_date, reason")
      .eq("creator_id", user.id),

    supabase
      .from("bookings")
      .select("client_name, booking_date, duration_minutes, status")
      .eq("creator_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true }),
  ]);

  return NextResponse.json({
    availability: availability.data,
    blockedDates: blocked.data,
    bookings: bookings.data,
  });
}
