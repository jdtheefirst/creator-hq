"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/config/admin";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export default function SubscribersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin(user.email)) {
      router.push("/dashboard");
      return;
    }

    fetchSubscribers();
  }, [user, router]);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      setError("Failed to fetch subscribers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscriberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchSubscribers();
    } catch (err) {
      setError("Failed to update subscriber status");
      console.error(err);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchSubscribers();
    } catch (err) {
      setError("Failed to delete subscriber");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Newsletter Subscribers
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your newsletter subscribers and their subscription status.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Subscribed At
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {subscriber.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(
                          subscriber.subscribed_at
                        ).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subscriber.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {subscriber.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() =>
                            toggleSubscriberStatus(
                              subscriber.id,
                              subscriber.is_active
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {subscriber.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteSubscriber(subscriber.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
