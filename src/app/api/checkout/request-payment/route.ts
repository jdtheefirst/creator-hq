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
    const { booking, note } = await req.json();

    if (!booking) {
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
      .eq("id", booking.id);

    // Send email with payment link
    const res = await resend.emails.send({
      from: "jngatia045@gmail.com",
      to: booking.client_email,
      subject: "Complete Your Payment 💳",
      html: `
  <div style="font-family: sans-serif; color: #111; line-height: 1.6; max-width: 600px; margin: auto;">
    <h2 style="color: #000;">Hey ${booking.client_name},</h2>
    
    <p>Your booking is almost locked in! Just one last step to secure your spot:</p>
    
    <p><strong>Service:</strong> ${booking.service_type}</p>
    <p><strong>Price:</strong> $${booking.price}</p>
    
    <p>
      <a href="${session.url}" 
         style="display: inline-block; padding: 12px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">
        👉 Complete Your Payment
      </a>
    </p>

    ${note ? `<p><strong>Note from creator:</strong> ${note}</p>` : ""}

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

    <p style="font-size: 0.9em; color: #555;">
      This booking experience is powered by <strong>Creator-HQ</strong> — your creator’s digital home for bookings, content, and exclusive fan access. 
    </p>
    <p style="font-size: 0.9em; color: #555;">
      Are you a content creator? <a href="https://creatorhq.com" style="color: #000; text-decoration: underline;">Join Creator-HQ</a> and build your own branded HQ today.
    </p>

    <p style="font-size: 0.8em; color: #999; margin-top: 40px;">
      Questions? Just reply to this email and someone will hit you up.
    </p>
  </div>
`,
    });

    if (res.error) {
      console.error("Error sending email:", res.error);
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ paymentUrl: session.url });
  } catch (err) {
    console.error("[request-payment]", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
