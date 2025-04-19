import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const shipping = session.customer_details?.address || null;
      const type = metadata.type;
      console.log("Session metadata:", metadata);
      console.log("Session shipping:", shipping, "type:", type);

      if (type === "order") {
        const userId = metadata.userId;
        const rawCart = metadata.cart;

        if (!userId || !rawCart) {
          console.error("Missing required metadata for order", {
            userId,
            rawCart,
          });
          return NextResponse.json(
            { error: "Invalid order metadata" },
            { status: 400 }
          );
        }

        let cart;
        try {
          cart = JSON.parse(rawCart);
        } catch (err) {
          console.error("Invalid cart JSON:", err);
          return NextResponse.json(
            { error: "Malformed cart" },
            { status: 400 }
          );
        }

        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            creator_id: process.env.NEXT_PUBLIC_CREATOR_UID,
            stripe_session_id: session.id,
            currency: session.currency,
            total_amount: session.amount_total! / 100,
            status: "paid",
            shipping_address: shipping
              ? {
                  line1: shipping.line1,
                  city: shipping.city,
                  postal_code: shipping.postal_code,
                  country: shipping.country,
                }
              : null,
          })
          .select()
          .single();

        // Log the order data for debugging
        console.log("Order created:", order);

        if (orderError) {
          console.error("Order insert failed:", orderError);
          return NextResponse.json(
            { error: "Order insert failed" },
            { status: 500 }
          );
        }

        const items = cart.map((item: any) => ({
          order_id: order.id,
          purchasable_type: item.purchasable_type,
          purchasable_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency: item.currency,
        }));
        // Log the items to be inserted for debugging
        console.log("Items to insert:", items);

        const { error: itemsError } = await supabaseAdmin
          .from("order_items")
          .insert(items);

        if (itemsError) {
          console.error("Order items insert failed:", itemsError);

          // Optional rollback to keep DB clean
          await supabaseAdmin.from("orders").delete().eq("id", order.id);

          return NextResponse.json(
            { error: "Items insert failed" },
            { status: 500 }
          );
        }
      } else if (type === "booking") {
        const { bookingId, creator_id } = metadata;

        if (!bookingId || !creator_id) {
          console.error("Missing booking metadata", metadata);
          return NextResponse.json(
            { error: "Missing booking info" },
            { status: 400 }
          );
        }

        await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
          })
          .eq("id", bookingId)
          .eq("creator_id", creator_id);

        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select(`*, profiles!creator_id ( full_name, contact_email )`)
          .eq("id", bookingId)
          .single();

        if (!booking) {
          console.error("Booking not found after update:", bookingId);
          return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
          );
        }

        await Promise.all([
          resend.emails.send({
            from: "jngatia045@gmail.com",
            to: booking.client_email,
            subject: "Payment Confirmed",
            html: `
              <h1>Payment Confirmed</h1>
              <p>Your payment for the booking with ${booking.profiles.full_name} has been confirmed.</p>
              <ul>
                <li>Service: ${booking.service_type}</li>
                <li>Date: ${new Date(booking.booking_date).toLocaleString()}</li>
                <li>Amount: $${booking.price}</li>
              </ul>
            `,
          }),
          resend.emails.send({
            from: "jngatia045@gmail.com",
            to: booking.profiles.contact_email,
            subject: "Payment Received",
            html: `
              <h1>Payment Received</h1>
              <p>Payment received for booking with ${booking.client_name}.</p>
              <p>Amount: $${booking.price}</p>
            `,
          }),
        ]);

        await supabaseAdmin.rpc("update_revenue_metrics", {
          p_creator_id: creator_id,
          p_amount: session.amount_total! / 100,
          p_date: new Date().toISOString(),
        });
      } else {
        console.warn("Unknown metadata.type:", type);
        return NextResponse.json(
          { error: "Unknown session type" },
          { status: 400 }
        );
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const session = await stripe.checkout.sessions.retrieve(
        charge.payment_intent as string
      );
      const { bookingId, creator_id } = session.metadata || {};

      if (bookingId && creator_id) {
        await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "refunded",
            status: "cancelled",
          })
          .eq("id", bookingId)
          .eq("creator_id", creator_id);
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
