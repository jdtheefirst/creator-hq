import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      creator_id,
      client_name,
      client_email,
      service_type,
      booking_date,
      duration_minutes,
      price,
      notes,
    } = await request.json();

    // Create booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([
        {
          creator_id,
          client_name,
          client_email,
          service_type,
          booking_date,
          duration_minutes,
          price,
          notes,
          status: "pending",
          payment_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Get creator details
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, contact_email")
      .eq("id", creator_id)
      .single();

    // Send confirmation emails
    await Promise.all([
      // Send to client
      resend.emails.send({
        from: "bookings@yourdomain.com",
        to: client_email,
        subject: "Booking Confirmation",
        html: `
          <h1>Booking Confirmation</h1>
          <p>Your booking with ${creator?.full_name} has been received.</p>
          <p>Details:</p>
          <ul>
            <li>Service: ${service_type}</li>
            <li>Date: ${new Date(booking_date).toLocaleString()}</li>
            <li>Duration: ${duration_minutes} minutes</li>
            <li>Price: $${price}</li>
          </ul>
        `,
      }),
      // Send to creator
      resend.emails.send({
        from: "bookings@yourdomain.com",
        to: creator?.contact_email,
        subject: "New Booking Request",
        html: `
          <h1>New Booking Request</h1>
          <p>You have a new booking request from ${client_name}.</p>
          <p>Details:</p>
          <ul>
            <li>Service: ${service_type}</li>
            <li>Date: ${new Date(booking_date).toLocaleString()}</li>
            <li>Duration: ${duration_minutes} minutes</li>
            <li>Price: $${price}</li>
            <li>Client Email: ${client_email}</li>
            <li>Notes: ${notes || "None"}</li>
          </ul>
        `,
      }),
    ]);

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to process booking" },
      { status: 500 }
    );
  }
}
