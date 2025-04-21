import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ratelimit } from "@/lib/limit";
import { BookingSchema } from "@/lib/bookingSchema";

export async function POST(req: Request) {
  const body = await req.json();
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  const { success } = await ratelimit.limit(ip.toString());

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const date = new Date(body.booking_date);
  const [hh, mm] = body.booking_time.split(":").map(Number);
  date.setUTCHours(hh, mm, 0, 0);
  body.booking_date = date.toISOString();

  const { error } = await supabaseAdmin.from("bookings").insert({
    ...body,
    status: "pending", // default safety
  });

  if (error) {
    console.error("Booking insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
