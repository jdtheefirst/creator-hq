"use client";

import { useEffect, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/lib/context/AuthContext";

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
  const { supabase } = useAuth();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to user activity changes
      channel = supabase
        .channel("user_activity")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_engagement",
          },
          (payload: any) => {
            console.log("New user activity:", payload);
            // Update stats based on the new activity
            setStats((prev) => ({
              ...prev,
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

      // Fetch initial stats
      const { data: initialStats } = await supabase
        .from("user_engagement")
        .select("page_path")
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (initialStats) {
        const currentPages = initialStats.reduce(
          (acc: Record<string, number>, stat: { page_path: string }) => {
            acc[stat.page_path] = (acc[stat.page_path] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        interface InitialStat {
          page_path: string;
        }

        setStats({
          active_users: new Set(
            initialStats.map((stat: InitialStat) => stat.page_path)
          ).size,
          page_views: initialStats.length,
          current_pages: currentPages,
        });
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Real-Time Analytics</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.active_users}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.page_views}</p>
          <p className="text-sm text-gray-600">Page Views</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {Object.keys(stats.current_pages).length}
          </p>
          <p className="text-sm text-gray-600">Active Pages</p>
        </div>
      </div>
    </div>
  );
}
