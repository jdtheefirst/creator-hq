import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creator_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  if (!creatorId) {
    return NextResponse.json({ error: "Creator ID required" }, { status: 400 });
  }

  try {
    // Get booking analytics
    const { data: bookingStats } = await supabase.rpc(
      "aggregate_booking_metrics",
      {
        p_creator_id: creatorId,
        p_start_date:
          startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      }
    );

    // Get revenue metrics
    const { data: revenueMetrics } = await supabase
      .from("revenue_metrics")
      .select("*")
      .eq("creator_id", creatorId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // Get engagement metrics
    const { data: engagementMetrics } = await supabase.rpc(
      "aggregate_engagement_metrics",
      {
        creator_id: creatorId,
        start_date: startDate,
        end_date: endDate,
      }
    );

    return NextResponse.json({
      bookingStats,
      revenueMetrics,
      engagementMetrics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
