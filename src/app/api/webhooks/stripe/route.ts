import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Stripe from "stripe";
import { Resend } from "resend";
import { secureRatelimit } from "@/lib/limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      // Handle successful checkout session
      // Check if the session is for an order or a booking
      const session = event.data.object as unknown as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const shipping = session.customer_details?.address || null;
      const type = metadata.type;
      // const paymentStatus = session.payment_status;

      if (type === "order") {
        // Handle order session
        const userId = metadata.userId;
        const creatorId = metadata.creatorId;
        const rawCart = metadata.cart;

        if (!userId || !rawCart || !creatorId) {
          console.error("Missing required metadata for order", {
            userId,
            rawCart,
            creatorId,
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
            creator_id: creatorId,
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
          unit_price: item.unit_price,
          currency: item.currency,
        }));

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

        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session update failed:", error);
          return NextResponse.json(
            { error: "Checkout session update failed" },
            { status: 500 }
          );
        }

        const { error: metricsError } = await supabaseAdmin.rpc(
          "update_revenue_metrics",
          {
            p_creator_id: creatorId,
            p_amount: session.amount_total! / 100,
            p_date: new Date().toISOString(),
            p_source_type: "order",
          }
        );

        if (metricsError) {
          console.error("Metrics update failed:", metricsError);
          return NextResponse.json(
            { error: "Metrics update failed" },
            { status: 500 }
          );
        }
      } else if (type === "booking") {
        // Handle booking session
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

        const { error: metricsError } = await supabaseAdmin.rpc(
          "update_revenue_metrics",
          {
            p_creator_id: creator_id,
            p_amount: session.amount_total! / 100,
            p_date: new Date().toISOString(),
            p_source_type: "booking",
          }
        );

        if (metricsError) {
          console.error("Metrics update failed:", metricsError);
          return NextResponse.json(
            { error: "Metrics update failed" },
            { status: 500 }
          );
        }
      } else if (type === "vip") {
        // Handle VIP session
        const userId = metadata.userId;
        const creatorId = metadata.creatorId;

        if (!userId || !creatorId) {
          console.error("Missing required metadata for VIP", {
            userId,
            creatorId,
          });
          return NextResponse.json(
            { error: "Invalid VIP metadata" },
            { status: 400 }
          );
        }

        // Update the user to VIP status
        const { error: userError } = await supabaseAdmin
          .from("users")
          .update({ is_vip: true })
          .eq("id", userId)
          .select()
          .single();

        if (userError) {
          console.error("User update failed:", userError);
          return NextResponse.json(
            { error: "User update failed" },
            { status: 500 }
          );
        }

        // Update the checkout session status to completed
        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }

        const { error: metricsError } = await supabaseAdmin.rpc(
          "update_revenue_metrics",
          {
            p_creator_id: creatorId,
            p_amount: session.amount_total! / 100,
            p_date: new Date().toISOString(),
            p_source_type: "vip",
          }
        );

        if (metricsError) {
          console.error("Metrics update failed:", metricsError);
          return NextResponse.json(
            { error: "Metrics update failed" },
            { status: 500 }
          );
        }
      } else if (type === "payment_link") {
        // Handle payment link session
        const booking_id = metadata.booking_id;
        const creatorId = metadata.creatorId;

        if (!booking_id || !creatorId) {
          console.error("Missing required metadata for payment link", {
            booking_id,
            creatorId,
          });
          return NextResponse.json(
            { error: "Invalid payment link metadata" },
            { status: 400 }
          );
        }

        // update booking status to paid
        const { error: bookingError } = await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
          })
          .eq("id", booking_id)
          .eq("creator_id", creatorId);

        if (bookingError) {
          console.error("Booking update failed:", bookingError);
          return NextResponse.json(
            { error: "Booking update failed" },
            { status: 500 }
          );
        }

        // Update the checkout session status to completed
        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }

        const { error: metricsError } = await supabaseAdmin.rpc(
          "update_revenue_metrics",
          {
            p_creator_id: creatorId,
            p_amount: session.amount_total! / 100,
            p_date: new Date().toISOString(),
            p_source_type: "payment_link",
          }
        );

        if (metricsError) {
          console.error("Metrics update failed:", metricsError);
          return NextResponse.json(
            { error: "Metrics update failed" },
            { status: 500 }
          );
        }
      } else if (type === "course") {
        // Handle course session
        const courseId = metadata.courseId;
        const userId = metadata.userId;
        const creatorId = metadata.creatorId;

        if (!courseId || !userId || !creatorId) {
          console.error("Missing required metadata for course", {
            courseId,
            userId,
            creatorId,
          });
          return NextResponse.json(
            { error: "Invalid course metadata" },
            { status: 400 }
          );
        }

        // Update the user to enrolled in the course
        const { error: courseError } = await supabaseAdmin.rpc(
          "enroll_user_to_course",
          {
            course_id_input: courseId,
            user_id_input: userId,
          }
        );

        if (courseError) {
          console.error("Course update failed:", courseError);
          return NextResponse.json(
            { error: "Course update failed" },
            { status: 500 }
          );
        }

        // Update the checkout session status to completed
        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }
      } else {
        console.warn("Unknown metadata.type:", type);
        return NextResponse.json(
          { error: "Unknown session type" },
          { status: 400 }
        );
      }
    } else if (event.type === "charge.refunded") {
      // Handle charge refunded event
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
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

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

        await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);
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
            payment_status: "expired",
            status: "cancelled",
          })
          .eq("id", bookingId)
          .eq("creator_id", creator_id);

        const { error } = await supabaseAdmin

          .from("checkout_sessions")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }
      } else if (type === "payment_link") {
        const { booking_id, creatorId } = metadata;

        if (!booking_id || !creatorId) {
          console.error("Missing required metadata for payment link", {
            booking_id,
            creatorId,
          });
          return NextResponse.json(
            { error: "Invalid payment link metadata" },
            { status: 400 }
          );
        }

        // update booking status to expired
        const { error: bookingError } = await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "expired",
            status: "cancelled",
          })
          .eq("id", booking_id)
          .eq("creator_id", creatorId);

        if (bookingError) {
          console.error("Booking update failed:", bookingError);
          return NextResponse.json(
            { error: "Booking update failed" },
            { status: 500 }
          );
        }

        // Update the checkout session status to completed
        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }
      } else if (type === "vip") {
        const userId = metadata.userId;
        const creatorId = metadata.creatorId;

        if (!userId || !creatorId) {
          console.error("Missing required metadata for VIP", {
            userId,
            creatorId,
          });
          return NextResponse.json(
            { error: "Invalid VIP metadata" },
            { status: 400 }
          );
        }

        // Update the user to VIP status
        const { error: userError } = await supabaseAdmin
          .from("users")
          .update({ is_vip: false })
          .eq("id", userId)
          .select()
          .single();

        if (userError) {
          console.error("User update failed:", userError);
          return NextResponse.json(
            { error: "User update failed" },
            { status: 500 }
          );
        }

        // Update the checkout session status to completed
        const { error } = await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Checkout session insert failed:", error);
          return NextResponse.json(
            { error: "Checkout session insert failed" },
            { status: 500 }
          );
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      // Handle payment failure
      const session = event.data.object as unknown as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

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

        await supabaseAdmin
          .from("checkout_sessions")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id);
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
