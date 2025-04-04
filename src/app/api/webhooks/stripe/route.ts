import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { bookingId, creator_id } = session.metadata!;

        // Update booking payment status
        await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
          })
          .eq("id", bookingId)
          .eq("creator_id", creator_id);

        // Fetch booking and creator details
        const { data: booking } = await supabase
          .from("bookings")
          .select(
            `
            *,
            profiles!creator_id (
              full_name,
              contact_email
            )
          `
          )
          .eq("id", bookingId)
          .single();

        // Send confirmation emails
        await Promise.all([
          // Client confirmation
          resend.emails.send({
            from: "bookings@yourdomain.com",
            to: booking.client_email,
            subject: "Payment Confirmed",
            html: `
              <h1>Payment Confirmed</h1>
              <p>Your payment for the booking with ${booking.profiles.full_name} has been confirmed.</p>
              <p>Booking details:</p>
              <ul>
                <li>Service: ${booking.service_type}</li>
                <li>Date: ${new Date(booking.booking_date).toLocaleString()}</li>
                <li>Amount: $${booking.price}</li>
              </ul>
            `,
          }),
          // Creator notification
          resend.emails.send({
            from: "bookings@yourdomain.com",
            to: booking.profiles.contact_email,
            subject: "Payment Received",
            html: `
              <h1>Payment Received</h1>
              <p>Payment received for booking with ${booking.client_name}.</p>
              <p>Amount: $${booking.price}</p>
            `,
          }),
        ]);

        // Update analytics
        await supabase.rpc("update_revenue_metrics", {
          p_creator_id: creator_id,
          p_amount: session.amount_total! / 100,
          p_date: new Date().toISOString(),
        });

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const session = await stripe.checkout.sessions.retrieve(
          charge.payment_intent as string
        );
        const { bookingId, creator_id } = session.metadata!;

        await supabase
          .from("bookings")
          .update({
            payment_status: "refunded",
            status: "cancelled",
          })
          .eq("id", bookingId)
          .eq("creator_id", creator_id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
