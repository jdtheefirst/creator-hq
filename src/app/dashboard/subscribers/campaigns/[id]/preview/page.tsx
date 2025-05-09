import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function CampaignPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = await params;

  const { data: campaign, error } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user?.id)
    .single();

  if (error || !campaign) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Preview Header */}
        <div className="mb-8">
          <div className="text-gray-600">
            <span className="font-medium font-bold text-gray-900">Title:</span>{" "}
            {campaign.title}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-gray-600">
              <span className="font-medium">Subject:</span> {campaign.subject}
            </div>
            <div className="flex space-x-4">
              <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {campaign.status.toUpperCase()}
              </div>
              {campaign.sent_at && (
                <div className="text-sm text-gray-500">
                  Sent:{" "}
                  {format(new Date(campaign.sent_at), "MMM d, yyyy h:mm a")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {campaign.stats.sent}
            </div>
            <div className="text-sm text-gray-500">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {campaign.stats.opened}
            </div>
            <div className="text-sm text-gray-500">Opened</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {campaign.stats.clicked}
            </div>
            <div className="text-sm text-gray-500">Clicked</div>
          </div>
        </div>

        {/* Email Content Preview */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Campaign ID: {campaign.id}</p>
          {campaign.scheduled_for && (
            <p>
              Scheduled for:{" "}
              {format(new Date(campaign.scheduled_for), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
