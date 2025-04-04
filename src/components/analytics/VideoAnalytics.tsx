"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Line, Bar } from "react-chartjs-2";
import { format } from "date-fns";

interface VideoAnalyticsProps {
  data: any[];
}

export default function VideoAnalytics({ data }: VideoAnalyticsProps) {
  const viewsData = {
    labels: data.map((m) => format(new Date(m.date), "MMM d")),
    datasets: [
      {
        label: "Views",
        data: data.map((m) => m.total_views),
        borderColor: "rgb(59, 130, 246)",
        tension: 0.1,
      },
    ],
  };

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const engagementData = {
    labels: data.map((m) => format(new Date(m.date), "MMM d")),
    datasets: [
      {
        label: "Likes",
        data: data.map((m) => m.total_likes),
        backgroundColor: "rgb(239, 68, 68)",
      },
      {
        label: "Comments",
        data: data.map((m) => m.total_comments),
        backgroundColor: "rgb(34, 197, 94)",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
          <p className="mt-2 text-3xl font-semibold">
            {data.reduce((sum, m) => sum + m.total_views, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Likes</h3>
          <p className="mt-2 text-3xl font-semibold">
            {data.reduce((sum, m) => sum + m.total_likes, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
          <p className="mt-2 text-3xl font-semibold">
            {data.reduce((sum, m) => sum + m.total_comments, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Views Over Time</h3>
        <Line data={viewsData} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Engagement Metrics</h3>
        <Bar data={engagementData} />
      </div>
    </div>
  );
}
