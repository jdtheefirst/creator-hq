import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealTimeStats {
  active_users: number;
  page_views: number;
  current_pages: Record<string, number>;
}

export default function RealTimeAnalytics() {
  const [stats, setStats] = useState<RealTimeStats>({
    active_users: 0,
    page_views: 0,
    current_pages: {},
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Initial fetch of real-time stats
    const fetchRealTimeStats = async () => {
      const { data, error } = await supabase.rpc("get_realtime_analytics", {
        minutes: 5,
      });

      if (!error && data) {
        setStats(
          data[0] || { active_users: 0, page_views: 0, current_pages: {} }
        );
      }
    };

    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 60000); // Refresh every minute

    // Subscribe to real-time updates
    const channel = supabase
      .channel("page_views")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "page_views",
        },
        (payload) => {
          setStats((prev) => ({
            active_users: prev.active_users + 1,
            page_views: prev.page_views + 1,
            current_pages: {
              ...prev.current_pages,
              [payload.new.page_path]:
                (prev.current_pages[payload.new.page_path] || 0) + 1,
            },
          }));
        }
      )
      .subscribe();

    setChannel(channel);

    return () => {
      clearInterval(interval);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [supabase]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Real-Time Analytics</h2>
        <span className="flex items-center text-sm text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-2xl font-semibold">{stats.active_users}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Page Views</h3>
          <p className="text-2xl font-semibold">{stats.page_views}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Current Pages
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.current_pages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([path, count]) => (
              <div
                key={path}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm truncate flex-1">{path}</span>
                <span className="text-sm font-medium ml-4">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
