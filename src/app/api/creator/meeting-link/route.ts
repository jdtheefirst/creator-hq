import { BookingFormValues } from "@/lib/bookingSchema";
import { secureRatelimit } from "@/lib/limit";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

interface RequestBody {
  meetingLink: string;
  note?: string;
  booking: BookingFormValues;
}

export async function POST(req: Request) {
  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { meetingLink, note, booking }: RequestBody = await req.json();
    console.log("[send-meeting-link]", booking, meetingLink, note);

    if (!booking?.client_email || !meetingLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const readableDate = new Date(booking.booking_date).toLocaleString(
      "en-US",
      {
        dateStyle: "full",
        timeStyle: "short",
      }
    );

    const result = await resend.emails.send({
      from: "jngatia@gmail.com",
      to: booking.client_email,
      subject: `✅ Your ${booking.service_type} booking is confirmed!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 1rem; border-radius: 8px; background: #f9f9f9;">
          <h2 style="color: #111;">Hey ${booking.client_name},</h2>
          <p>Awesome news — your <strong>${booking.service_type}</strong> booking is locked in! Here are the full details:</p>

          <ul style="padding-left: 1rem;">
            <li><strong>📅 Date & Time:</strong> ${readableDate}</li>
            <li><strong>⏱ Duration:</strong> ${booking.duration_minutes} minutes</li>
            <li><strong>🧑 Starting:</strong> ${booking.booking_time}</li>
            <li><strong>💵 Price:</strong> $${Number(booking.price).toFixed(2)} (${booking.payment_status})</li>
            <li><strong>📞 Phone:</strong> ${booking.phone}</li>
            <li><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></li>
          </ul>

          ${
            note
              ? `<p><strong>📝 Note from the creator:</strong><br>${note}</p>`
              : ""
          }

          <p>If you have any questions or need to reschedule, just reply to this email. Looking forward to connecting with you!</p>

          <p style="margin-top: 2rem;">Cheers,<br/>The Team ✌️</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[send-meeting-link]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
