import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Fetch active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email")
      .eq("creator_id", campaign.creator_id)
      .eq("is_active", true);

    if (subscribersError) throw subscribersError;

    // Get creator details
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", campaign.creator_id)
      .single();

    // Send emails to each subscriber with tracking
    const emailPromises = subscribers.map(async (subscriber) => {
      // Create tracking pixel for opens
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/track/${campaignId}/${subscriber.id}/open" width="1" height="1" style="display: none;" />`;

      // Process content to add click tracking to all links
      let emailContent = campaign.content.replace(
        /<a\s+href="([^"]+)"/g,
        (match: any, url: string) =>
          `<a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/track/${campaignId}/${subscriber.id}/click?url=${encodeURIComponent(url)}"`
      );

      // Add tracking pixel at the end of the email
      emailContent = `
        <div>
          ${emailContent}
          ${trackingPixel}
        </div>
      `;

      // Send email using Resend
      return resend.emails.send({
        from: `${creator?.full_name} <newsletter@yourdomain.com>`,
        to: subscriber.email,
        subject: campaign.subject,
        html: emailContent,
      });
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);
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

    // Create campaign logs
    const campaignLogs = subscribers.map((subscriber) => ({
      campaign_id: campaignId,
      subscriber_id: subscriber.id,
      event_type: "sent",
    }));

    await supabase.from("newsletter_campaign_logs").insert(campaignLogs);

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
      sent_to: subscribers.length,
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
