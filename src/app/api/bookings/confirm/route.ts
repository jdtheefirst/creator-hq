import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { syncBookingToCalendar } from "@/lib/calendar/google";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { bookingId } = await request.json();

    // Fetch booking with creator details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        profiles!creator_id (
          full_name,
          contact_email,
          timezone
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    // Send confirmation emails
    await Promise.all([
      // Client confirmation
      resend.emails.send({
        from: "bookings@yourdomain.com",
        to: booking.client_email,
        subject: `Booking Confirmed: ${booking.service_type} with ${booking.profiles.full_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Your Booking is Confirmed!</h1>
            <p>Dear ${booking.client_name},</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Service:</strong> ${booking.service_type}</p>
              <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleString("en-US", { timeZone: booking.profiles.timezone })}</p>
              <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
              ${booking.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${booking.meeting_link}">${booking.meeting_link}</a></p>` : ""}
            </div>
            <p>If you need to make any changes, please contact ${booking.profiles.full_name} directly.</p>
          </div>
        `,
      }),

      // Creator notification
      resend.emails.send({
        from: "bookings@yourdomain.com",
        to: booking.profiles.contact_email,
        subject: `New Booking: ${booking.service_type} with ${booking.client_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>New Booking Confirmed</h1>
            <p>You have a new booking from ${booking.client_name}.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Service:</strong> ${booking.service_type}</p>
              <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleString("en-US", { timeZone: booking.profiles.timezone })}</p>
              <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
              <p><strong>Client Email:</strong> ${booking.client_email}</p>
              <p><strong>Notes:</strong> ${booking.notes || "None"}</p>
            </div>
            <p>Please ensure to set up the meeting link and update the booking details if needed.</p>
          </div>
        `,
      }),
    ]);

    // Update booking status
    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    // Sync booking to calendar
    const { data: calendarTokens } = await supabase
      .from("creator_calendar_tokens")
      .select("*")
      .eq("creator_id", booking.creator_id)
      .single();

    if (calendarTokens) {
      try {
        await syncBookingToCalendar(booking, {
          access_token: calendarTokens.access_token,
          refresh_token: calendarTokens.refresh_token,
          expiry_date: calendarTokens.expiry_date,
        });
      } catch (error) {
        console.error("Calendar sync error:", error);
        // Don't fail the booking confirmation if calendar sync fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
