import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: {
    params: { campaignId: string; subscriberId: string; action: string };
  }
) {
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { campaignId, subscriberId, action } = context.params;
  const { searchParams } = new URL(request.url);

  if (action !== "open" && action !== "click") {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const { data: campaign } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("stats")
      .eq("id", campaignId)
      .single();

    if (!campaign) {
      return new NextResponse(null, { status: 404 });
    }

    const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0 };
    if (action === "open") stats.opened++;
    else if (action === "click") stats.clicked++;

    await supabaseAdmin
      .from("newsletter_campaigns")
      .update({ stats })
      .eq("id", campaignId);

    await supabaseAdmin.from("newsletter_campaign_logs").insert({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      event_type: action,
      metadata: action === "click" ? { url: searchParams.get("url") } : null,
    });

    if (action === "click") {
      const targetUrl = searchParams.get("url");
      return targetUrl
        ? NextResponse.redirect(targetUrl)
        : new NextResponse(null, { status: 400 });
    }

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
