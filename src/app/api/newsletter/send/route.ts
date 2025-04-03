import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { campaignId } = await request.json();

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .select("*, creator_id")
      .eq("id", campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Fetch active subscribers for this creator
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email")
      .eq("creator_id", campaign.creator_id)
      .eq("is_active", true);

    if (subscribersError) throw subscribersError;

    // Create campaign logs for tracking
    const campaignLogs = subscribers.map((subscriber) => ({
      campaign_id: campaignId,
      subscriber_id: subscriber.id,
      event_type: "sent",
    }));

    await supabase.from("newsletter_campaign_logs").insert(campaignLogs);

    // Update campaign status and stats
    await supabase
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        stats: {
          sent: subscribers.length,
          opened: 0,
          clicked: 0,
        },
      })
      .eq("id", campaignId);

    // Track campaign send event
    await supabase.from("user_engagement").insert([
      {
        creator_id: campaign.creator_id,
        event_type: "conversion",
        page_path: "/newsletter/campaign/send",
        metadata: {
          campaign_id: campaignId,
          subscribers_count: subscribers.length,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sent_to: subscribers.length,
      },
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
