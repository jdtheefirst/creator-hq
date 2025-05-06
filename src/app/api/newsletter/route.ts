import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { email, creatorId } = await request.json();

    // Validate email
    if (!email || !creatorId) {
      return NextResponse.json(
        { error: "Email and creator_id are required" },
        { status: 400 }
      );
    }

    // Add subscriber
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert([
        {
          email: email,
          creator_id: creatorId,
          is_active: true,
        },
      ])
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        // Unique violation
        return NextResponse.json(
          { error: "Already subscribed" },
          { status: 409 }
        );
      }
      throw error;
    }

    // Track subscription event
    await supabaseAdmin.from("user_engagement").insert([
      {
        creator_id: creatorId,
        event_type: "conversion",
        page_path: "/newsletter/subscribe",
        metadata: {
          subscription_id: data.id,
          email: email,
        },
      },
    ]);

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
