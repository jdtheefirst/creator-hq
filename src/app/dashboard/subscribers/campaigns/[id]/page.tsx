"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
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
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", params.id)
        .eq("creator_id", user?.id)
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

  const saveCampaign = async (updates: Partial<Campaign>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update(updates)
        .eq("id", params.id)
        .eq("creator_id", user?.id);
      if (error) throw error;
      setCampaign((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      setError("Failed to save campaign");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const scheduleCampaign = async (date: Date) => {
    await saveCampaign({
      status: "scheduled",
      scheduled_for: date.toISOString(),
    });
  };

  const sendCampaign = async () => {
    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          status: "sending",
          sent_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("creator_id", user?.id);

      if (error) throw error;

      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: params.id }),
      });

      if (!response.ok) throw new Error("Failed to send campaign");

      router.push("/dashboard/subscribers");
    } catch (err) {
      setError("Failed to send campaign");
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!campaign) return <div>Campaign not found</div>;
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <input
              type="text"
              value={campaign.title}
              onChange={(e) => saveCampaign({ title: e.target.value })}
              className="text-2xl font-bold w-full border-none focus:outline-none"
              placeholder="Campaign Title"
            />
            <input
              type="text"
              value={campaign.subject}
              onChange={(e) => saveCampaign({ subject: e.target.value })}
              className="text-lg w-full mt-2 border-none focus:outline-none"
              placeholder="Email Subject"
            />
          </div>
          <Editor
            value={campaign.content}
            onChange={(content) => saveCampaign({ content })}
          />

          <div className="mt-6 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => scheduleCampaign(new Date())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                disabled={campaign.status !== "draft"}
              >
                Schedule
              </button>
              <button
                onClick={sendCampaign}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
                disabled={campaign.status !== "draft"}
              >
                Send Now
              </button>
            </div>

            {campaign.stats && (
              <div className="flex gap-4 text-sm">
                <div>Sent: {campaign.stats.sent}</div>
                <div>Opened: {campaign.stats.opened}</div>
                <div>Clicked: {campaign.stats.clicked}</div>
              </div>
            )}
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
