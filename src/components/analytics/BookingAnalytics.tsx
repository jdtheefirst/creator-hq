"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Pie } from "react-chartjs-2";
import { Loader2 } from "lucide-react";

interface BookingMetrics {
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  avg_duration_minutes: number;
  revenue_generated: number;
}

export default function BookingAnalytics() {
  const { user, supabase } = useAuth();
  const [metrics, setMetrics] = useState<BookingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMetrics();
  }, [user]);

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from("booking_metrics")
      .select("*")
      .eq("creator_id", user?.id)
      .single();

    if (error) console.error("Failed to fetch booking metrics", error);
    else setMetrics(data);
    setLoading(false);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pieData = {
    labels: ["Completed", "Pending", "Cancelled"],
    datasets: [
      {
        data: [
          metrics.completed_bookings,
          metrics.pending_bookings,
          metrics.cancelled_bookings,
        ],
        backgroundColor: [
          "rgb(34, 197, 94)",
          "rgb(59, 130, 246)",
          "rgb(239, 68, 68)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.total_bookings}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Duration</h3>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.avg_duration_minutes} min
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="mt-2 text-3xl font-semibold">
            KES {metrics.revenue_generated.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Booking Status Pie */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Booking Status</h3>
        <div className="h-64">
          <Pie
            data={pieData}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>
    </div>
  );
}
