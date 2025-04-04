import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { bookingId, creator_id } = await request.json();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, profiles!creator_id(*)")
      .eq("id", bookingId)
      .eq("creator_id", creator_id)
      .single();

    if (bookingError) throw bookingError;

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${booking.service_type} with ${booking.profiles.full_name}`,
              description: `${booking.duration_minutes} minute session on ${new Date(booking.booking_date).toLocaleString()}`,
            },
            unit_amount: Math.round(booking.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${bookingId}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${bookingId}/cancel`,
      metadata: {
        bookingId,
        creator_id,
      },
    });

    // Update booking with payment session id
    await supabase
      .from("bookings")
      .update({ payment_id: session.id })
      .eq("id", bookingId);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
