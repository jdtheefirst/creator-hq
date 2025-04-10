"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Line, Pie } from "react-chartjs-2";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface NewsletterMetrics {
  total_subscribers: number;
  active_subscribers: number;
  new_subscribers: number;
  emails_sent: number;
  email_opens: number;
  email_clicks: number;
  bounce_rate: number;
  date: string;
}

interface NewsletterAnalyticsProps {
  startDate: string;
  endDate: string;
}

export default function NewsletterAnalytics({
  startDate,
  endDate,
}: NewsletterAnalyticsProps) {
  const { user, supabase } = useAuth();
  const [metrics, setMetrics] = useState<NewsletterMetrics[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user, dateRange]);

  const fetchMetrics = async () => {
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from("newsletter_metrics")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      const { data: campaigns, error: campaignsError } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (metricsError || campaignsError) throw metricsError || campaignsError;
      setMetrics(metrics || []);
      setCampaigns(campaigns || []);
    } catch (error) {
      console.error("Error fetching newsletter metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const latestMetrics = metrics[metrics.length - 1] || {
    total_subscribers: 0,
    active_subscribers: 0,
    emails_sent: 0,
    email_opens: 0,
    email_clicks: 0,
  };

  const subscriberData = {
    labels: metrics.map((m) => format(new Date(m.date), "MMM d")),
    datasets: [
      {
        label: "Total Subscribers",
        data: metrics.map((m) => m.total_subscribers),
        borderColor: "rgb(59, 130, 246)",
        tension: 0.1,
      },
      {
        label: "New Subscribers",
        data: metrics.map((m) => m.new_subscribers),
        borderColor: "rgb(34, 197, 94)",
        tension: 0.1,
      },
    ],
  };

  const engagementData = {
    labels: ["Opens", "Clicks", "No Interaction"],
    datasets: [
      {
        data: [
          latestMetrics.email_opens,
          latestMetrics.email_clicks,
          latestMetrics.emails_sent - latestMetrics.email_opens,
        ],
        backgroundColor: [
          "rgb(59, 130, 246)",
          "rgb(34, 197, 94)",
          "rgb(229, 231, 235)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Subscribers
          </h3>
          <p className="mt-2 text-3xl font-semibold">
            {latestMetrics.total_subscribers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Active Subscribers
          </h3>
          <p className="mt-2 text-3xl font-semibold">
            {latestMetrics.active_subscribers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Open Rate</h3>
          <p className="mt-2 text-3xl font-semibold">
            {latestMetrics.emails_sent
              ? `${((latestMetrics.email_opens / latestMetrics.emails_sent) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Click Rate</h3>
          <p className="mt-2 text-3xl font-semibold">
            {latestMetrics.emails_sent
              ? `${((latestMetrics.email_clicks / latestMetrics.emails_sent) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Subscriber Growth</h3>
        <Line data={subscriberData} options={{ responsive: true }} />
      </div>

      {/* Engagement Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Email Engagement</h3>
        <div className="h-64">
          <Pie
            data={engagementData}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>
    </div>
  );
}
