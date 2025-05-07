"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track page views and user engagement
  useAnalytics({ pagePath: "/dashboard/analytics" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your platform's performance and user engagement
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
