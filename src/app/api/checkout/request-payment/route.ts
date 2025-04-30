import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { secureRatelimit } from "@/lib/limit";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  // Check rate limit and user authentication
  const { success } = await secureRatelimit(req);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!success || userError || !user) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const { bookingId, note } = await req.json();

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: booking.client_email,
      line_items: [
        {
          price_data: {
            currency: "usd", // Or your local currency
            product_data: {
              name: `${booking.service_type} with ${booking.client_name}`,
            },
            unit_amount: Math.round(booking.price * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/bookme/payments?status=success`,
      cancel_url: `${siteUrl}/bookme/payments?status=cancelled`,
      metadata: {
        booking_id: booking.id,
        creatorId: user.id,
        type: "payment-link",
      },
    });

    await supabase.from("checkout_sessions").insert({
      user_id: user.id,
      creator_id: user.id,
      type: "payment-link",
      stripe_session_id: session.id,
      total_amount: session.amount_total! / 100,
      currency: "USD",
      items: JSON.stringify({ payment_link: session.url }),
      status: "pending",
    });

    // Update booking with payment link
    await supabaseAdmin
      .from("bookings")
      .update({ payment_link: session.url })
      .eq("id", bookingId);

    // Send email with payment link
    await resend.emails.send({
      from: "jngatia045@gmail.com",
      to: booking.client_email,
      subject: "Complete Your Payment 💳",
      html: `
        <h2>Hey ${booking.client_name},</h2>
        <p>Your booking is almost confirmed! Just one last step:</p>
        <p><strong>Service:</strong> ${booking.service_type}</p>
        <p><strong>Price:</strong> $${booking.price}</p>
        <p><a href="${session.url}">👉 Click here to complete your payment</a></p>
        ${note ? `<p><strong>Note from creator:</strong> ${note}</p>` : ""}
        <p>Thanks for booking 🙌</p>
      `,
    });

    return NextResponse.json({ paymentUrl: session.url });
  } catch (err) {
    console.error("[request-payment]", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
