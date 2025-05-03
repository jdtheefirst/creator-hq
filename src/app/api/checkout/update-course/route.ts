import { NextResponse } from "next/server";
import { ratelimit } from "@/lib/limit";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const headersData = await headers();
  const ip = headersData.get("x-forwarded-for") || "unknown";

  const { success } = await ratelimit.limit(ip.toString());

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const body = await req.json();
  const { courseId, userId } = body;

  try {
    const { error: courseError } = await supabaseAdmin.rpc(
      "enroll_user_to_course",
      {
        course_id_input: courseId,
        user_id_input: userId,
      }
    );

    if (courseError) {
      return NextResponse.json(
        { error: "Failed to enroll in the course." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Successfully enrolled in the course." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
