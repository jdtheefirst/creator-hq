"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Line } from "react-chartjs-2";

interface NewsletterStats {
  total_subscribers: number;
  active_subscribers: number;
  campaigns_sent: number;
  average_open_rate: number;
  average_click_rate: number;
}

export default function NewsletterAnalytics({
  creator_id,
}: {
  creator_id: string;
}) {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchStats();
  }, [creator_id]);

  const fetchStats = async () => {
    try {
      // Fetch subscriber counts
      const { data: subscribers, error: subError } = await supabase
        .from("newsletter_subscribers")
        .select("is_active")
        .eq("creator_id", creator_id);

      if (subError) throw subError;

      // Fetch campaign stats
      const { data: campaigns, error: campError } = await supabase
        .from("newsletter_campaigns")
        .select("stats")
        .eq("creator_id", creator_id)
        .eq("status", "sent");

      if (campError) throw campError;

      // Calculate statistics
      const totalSubs = subscribers.length;
      const activeSubs = subscribers.filter((s) => s.is_active).length;
      const campaignsSent = campaigns.length;

      const openRates = campaigns.map(
        (c) => (c.stats.opened / c.stats.sent) * 100
      );
      const clickRates = campaigns.map(
        (c) => (c.stats.clicked / c.stats.sent) * 100
      );

      setStats({
        total_subscribers: totalSubs,
        active_subscribers: activeSubs,
        campaigns_sent: campaignsSent,
        average_open_rate: openRates.length
          ? openRates.reduce((a, b) => a + b, 0) / openRates.length
          : 0,
        average_click_rate: clickRates.length
          ? clickRates.reduce((a, b) => a + b, 0) / clickRates.length
          : 0,
      });
    } catch (error) {
      console.error("Error fetching newsletter stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Newsletter Performance</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Subscribers</div>
          <div className="text-2xl font-semibold">
            {stats.total_subscribers}
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Active Subscribers</div>
          <div className="text-2xl font-semibold">
            {stats.active_subscribers}
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Campaigns Sent</div>
          <div className="text-2xl font-semibold">{stats.campaigns_sent}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Average Open Rate</div>
          <div className="h-2 bg-gray-200 rounded-full mt-2">
            <div
              className="h-2 bg-blue-600 rounded-full"
              style={{ width: `${stats.average_open_rate}%` }}
            />
          </div>
          <div className="text-sm mt-1">
            {stats.average_open_rate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Average Click Rate</div>
          <div className="h-2 bg-gray-200 rounded-full mt-2">
            <div
              className="h-2 bg-green-600 rounded-full"
              style={{ width: `${stats.average_click_rate}%` }}
            />
          </div>
          <div className="text-sm mt-1">
            {stats.average_click_rate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
