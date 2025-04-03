import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { email, creator_id } = await request.json();

    // Validate email
    if (!email || !creator_id) {
      return NextResponse.json(
        { error: "Email and creator_id are required" },
        { status: 400 }
      );
    }

    // Add subscriber
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert([
        {
          email,
          creator_id,
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
    await supabase.from("user_engagement").insert([
      {
        creator_id,
        event_type: "conversion",
        page_path: "/newsletter/subscribe",
        metadata: {
          subscription_id: data.id,
          email: email,
        },
      },
    ]);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
