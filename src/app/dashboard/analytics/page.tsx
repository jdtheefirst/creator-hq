import { format, subDays } from "date-fns";
import AnalyticsFilters from "@/components/AnalyticsFilters";
import RevenueChart from "@/components/analytics/RevenueChart";
import PageViewsChart from "@/components/analytics/PageViewsChart";
import UserEngagementChart from "@/components/analytics/UserEngagementChart";
import TopPages from "@/components/analytics/TopPages";
import UserDemographics from "@/components/analytics/UserDemographics";
import RealTimeAnalytics from "@/components/analytics/RealTimeAnalytics";
import NewsletterAnalytics from "@/components/analytics/NewsletterAnalytics";
import VideoAnalytics from "@/components/analytics/VideoAnalytics";
import { createClient } from "@/lib/supabase/server";
import BookingAnalytics from "@/components/analytics/BookingAnalytics";

interface AnalyticsPageProps {
  searchParams: {
    date_range?: string;
    start_date?: string;
    end_date?: string;
  };
}

interface DailyMetrics {
  date: string;
  total_views: number;
  unique_visitors: number;
  avg_time_spent: number;
  bounce_rate: number;
  top_countries: Record<string, number>;
  device_breakdown: Record<string, number>;
  browser_breakdown: Record<string, number>;
}

interface EngagementMetrics {
  date: string;
  total_events: number;
  event_types: Record<string, number>;
  avg_duration: number;
  top_pages: Record<string, number>;
}

interface PageViewData {
  view_date: string;
  page_path: string;
  device_type: string;
  country: string;
  total_views: number;
}

interface EngagementData {
  event_date: string;
  event_type: string;
  duration_seconds: number;
  total_events: number;
}

interface RevenueMetrics {
  date: string;
  total_revenue: number;
  bookings_revenue: number;
  products_revenue: number;
  total_bookings: number;
  total_products_sold: number;
  average_order_value: number;
}

interface VideoMetrics {
  date: string;
  total_views: number;
  total_likes: number;
  total_comments: number;
  watch_time_minutes: number;
}

type RPCResponse<T> = {
  data: T | null;
  error: Error | null;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const supabase = await createClient();

  // Default to last 30 days if no date range is specified
  const endDate = searchParams.end_date
    ? new Date(searchParams.end_date)
    : new Date();
  const startDate = searchParams.start_date
    ? new Date(searchParams.start_date)
    : subDays(endDate, 30);

  // Fetch aggregated metrics
  const { data: metricsData }: RPCResponse<DailyMetrics[]> = await supabase.rpc(
    "aggregate_daily_metrics",
    {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    }
  );

  // Fetch engagement metrics
  const { data: rawEngagementData }: RPCResponse<EngagementMetrics[]> =
    await supabase.rpc("aggregate_engagement_metrics", {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    });

  // Fetch revenue metrics
  const { data: revenueData }: RPCResponse<RevenueMetrics[]> = await supabase
    .from("revenue_metrics")
    .select("*")
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .order("date", { ascending: true });

  // Fetch video metrics
  const { data: videoMetrics }: RPCResponse<VideoMetrics[]> = await supabase
    .from("video_metrics")
    .select("*")
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .order("date", { ascending: true });

  const metrics = metricsData || [];
  const rawEngagement = rawEngagementData || [];

  // Calculate summary metrics
  const totalViews = metrics.reduce((sum, day) => sum + day.total_views, 0);
  const totalVisitors = metrics.reduce(
    (sum, day) => sum + day.unique_visitors,
    0
  );
  const avgTimeSpent =
    metrics.length > 0
      ? metrics.reduce((sum, day) => sum + day.avg_time_spent, 0) /
        metrics.length
      : 0;
  const bounceRate =
    metrics.length > 0
      ? metrics.reduce((sum, day) => sum + day.bounce_rate, 0) / metrics.length
      : 0;

  // Transform data for charts
  const pageViewData: PageViewData[] = metrics.flatMap((day) =>
    Object.entries(day.device_breakdown).map(([device_type, count]) => ({
      view_date: day.date,
      page_path: "/",
      device_type,
      country: Object.keys(day.top_countries)[0] || "Unknown",
      total_views: count,
    }))
  );

  const engagementData: EngagementData[] = rawEngagement.flatMap((day) =>
    Object.entries(day.event_types).map(([event_type, count]) => ({
      event_date: day.date,
      event_type,
      duration_seconds: day.avg_duration,
      total_events: count,
    }))
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <AnalyticsFilters
          currentDateRange={searchParams.date_range}
          currentStartDate={searchParams.start_date}
          currentEndDate={searchParams.end_date}
        />
      </div>

      {/* Real-Time Analytics */}
      <RealTimeAnalytics />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Total Views</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">
              {totalViews.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Unique Visitors</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">
              {totalVisitors.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Time Spent</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">
              {Math.round(avgTimeSpent)}s
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Bounce Rate</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">{bounceRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Page Views</h2>
          <PageViewsChart data={pageViewData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Engagement</h2>
          <UserEngagementChart data={engagementData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
          <TopPages data={pageViewData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Demographics</h2>
          <UserDemographics data={pageViewData} />
        </div>
      </div>

      {/* Newsletter & Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Revenue Analytics</h2>
          <RevenueChart data={revenueData || []} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Newsletter Performance</h2>
          <NewsletterAnalytics
            startDate={format(startDate, "yyyy-MM-dd")}
            endDate={format(endDate, "yyyy-MM-dd")}
          />
        </div>
      </div>

      {/* Booking & Video Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Video Performance</h2>
          <VideoAnalytics data={videoMetrics || []} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Booking Performance</h2>
          <BookingAnalytics />
        </div>
      </div>
    </div>
  );
}
