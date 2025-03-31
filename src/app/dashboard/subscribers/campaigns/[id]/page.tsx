"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/config/admin";
import dynamic from "next/dynamic";

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduled_for?: string;
  sent_at?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export default function CampaignEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<NewsletterCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!user || !isAdmin(user.email)) {
      router.push("/dashboard");
      return;
    }

    fetchCampaign();
  }, [user, router, params.id]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (err) {
      setError("Failed to fetch campaign");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          title: campaign.title,
          subject: campaign.subject,
          content: campaign.content,
        })
        .eq("id", campaign.id);

      if (error) throw error;
      router.push("/dashboard/subscribers?tab=campaigns");
    } catch (err) {
      setError("Failed to save campaign");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!campaign) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          status: "scheduled",
          scheduled_for: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // Schedule for tomorrow
        })
        .eq("id", campaign.id);

      if (error) throw error;
      router.push("/dashboard/subscribers?tab=campaigns");
    } catch (err) {
      setError("Failed to schedule campaign");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!campaign) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      if (error) throw error;
      router.push("/dashboard/subscribers?tab=campaigns");
    } catch (err) {
      setError("Failed to send campaign");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Campaign not found
          </h2>
          <p className="mt-2 text-gray-500">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Campaign
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage your newsletter campaign.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Campaign Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Campaign Title
          </label>
          <input
            type="text"
            id="title"
            value={campaign.title}
            onChange={(e) =>
              setCampaign((prev) => ({ ...prev!, title: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Email Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Email Subject
          </label>
          <input
            type="text"
            id="subject"
            value={campaign.subject}
            onChange={(e) =>
              setCampaign((prev) => ({ ...prev!, subject: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Content Editor */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            Email Content
          </label>
          <div className="mt-1">
            <Editor
              value={campaign.content}
              onChange={(content) =>
                setCampaign((prev) => ({ ...prev!, content }))
              }
              className="min-h-[400px]"
            />
          </div>
        </div>

        {/* Campaign Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Campaign Status
          </label>
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                campaign.status === "draft"
                  ? "bg-gray-100 text-gray-800"
                  : campaign.status === "scheduled"
                  ? "bg-yellow-100 text-yellow-800"
                  : campaign.status === "sent"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {campaign.status.charAt(0).toUpperCase() +
                campaign.status.slice(1)}
            </span>
            {campaign.scheduled_for && (
              <p className="mt-1 text-sm text-gray-500">
                Scheduled for:{" "}
                {new Date(campaign.scheduled_for).toLocaleString()}
              </p>
            )}
            {campaign.sent_at && (
              <p className="mt-1 text-sm text-gray-500">
                Sent: {new Date(campaign.sent_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        {campaign.stats && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign Stats
            </label>
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Sent</div>
                <div className="text-lg font-medium">{campaign.stats.sent}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Opened</div>
                <div className="text-lg font-medium">
                  {campaign.stats.opened}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Clicked</div>
                <div className="text-lg font-medium">
                  {campaign.stats.clicked}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {previewMode ? "Edit Mode" : "Preview Mode"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          {campaign.status === "draft" && (
            <>
              <button
                onClick={handleSchedule}
                disabled={saving}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                Schedule
              </button>
              <button
                onClick={handleSend}
                disabled={saving}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Send Now
              </button>
            </>
          )}
        </div>

        {/* Preview Mode */}
        {previewMode && (
          <div className="mt-8 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="border rounded-lg p-4">
              <div className="mb-4">
                <div className="text-sm text-gray-500">Subject:</div>
                <div className="font-medium">{campaign.subject}</div>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
