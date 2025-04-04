import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {
      campaignId: string;
      subscriberId: string;
      action: "open" | "click";
    };
  }
) {
  const supabase = await createClient();
  const { campaignId, subscriberId, action } = params;
  const { searchParams } = new URL(request.url);

  try {
    // Get campaign details
    const { data: campaign } = await supabase
      .from("newsletter_campaigns")
      .select("stats")
      .eq("id", campaignId)
      .single();

    if (!campaign) {
      return new NextResponse(null, { status: 404 });
    }

    // Update campaign stats
    const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0 };

    if (action === "open") {
      stats.opened++;
    } else if (action === "click") {
      stats.clicked++;
    }

    // Update campaign stats
    await supabase
      .from("newsletter_campaigns")
      .update({ stats })
      .eq("id", campaignId);

    // Log the event
    await supabase.from("newsletter_campaign_logs").insert({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      event_type: action,
      metadata: action === "click" ? { url: searchParams.get("url") } : null,
    });

    // If it's a click, redirect to the target URL
    if (action === "click") {
      const targetUrl = searchParams.get("url");
      if (targetUrl) {
        return NextResponse.redirect(targetUrl);
      }
    }

    // For opens, return a transparent 1x1 pixel
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Tracking error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
