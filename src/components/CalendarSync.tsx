"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

export default function CalendarSync() {
  const { user } = useAuth();
  const supabase = createBrowserClient();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    try {
      const { data } = await supabase
        .from("creator_calendar_tokens")
        .select("id")
        .eq("creator_id", user?.id)
        .single();

      setIsConnected(!!data);
    } catch (error) {
      console.error("Error checking calendar connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async () => {
    try {
      const response = await fetch("/api/calendar/connect");
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error connecting calendar:", error);
      toast.error("Failed to connect calendar");
    }
  };

  const disconnectCalendar = async () => {
    try {
      await supabase
        .from("creator_calendar_tokens")
        .delete()
        .eq("creator_id", user?.id);

      setIsConnected(false);
      toast.success("Calendar disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      toast.error("Failed to disconnect calendar");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Calendar Integration</h2>
        </div>
        {isConnected ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600" />
        )}
      </div>

      <p className="text-gray-600 mb-4">
        {isConnected
          ? "Your calendar is connected. Bookings will be automatically synced."
          : "Connect your Google Calendar to automatically sync your bookings."}
      </p>

      <button
        onClick={isConnected ? disconnectCalendar : connectCalendar}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isConnected
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isConnected ? "Disconnect Calendar" : "Connect Calendar"}
      </button>
    </div>
  );
}
