import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { secureRatelimit } from "@/lib/limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Rate limiting
  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Validate input
  const { email } = await req.json();
  if (!email?.includes("@")) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  try {
    // Single database call
    const { data, error } = await supabaseAdmin.rpc("join_waitlist", {
      p_email: email,
    });

    if (error) throw error;

    return NextResponse.json({
      message: data.message,
      isNew: data.isNew,
      status: data.status,
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to process signup" },
      { status: 500 }
    );
  }
}
