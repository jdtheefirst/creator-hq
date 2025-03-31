"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/config/admin";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduled_for?: string;
  sent_at?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export default function SubscribersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">(
    "subscribers"
  );
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!user || !isAdmin(user.email)) {
      router.push("/dashboard");
      return;
    }

    fetchSubscribers();
    fetchCampaigns();
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

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      setError("Failed to fetch campaigns");
      console.error(err);
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

  const createCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .insert([
          {
            title: "New Campaign",
            subject: "",
            content: "",
            status: "draft",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCampaigns((prev) => [data, ...prev]);
      router.push(`/dashboard/subscribers/campaigns/${data.id}`);
    } catch (err) {
      setError("Failed to create campaign");
      console.error(err);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
    } catch (err) {
      setError("Failed to delete campaign");
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
            Newsletter Management
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your newsletter subscribers and campaigns.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`${
              activeTab === "subscribers"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Subscribers
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`${
              activeTab === "campaigns"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Campaigns
          </button>
        </nav>
      </div>

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && (
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
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="mt-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={createCampaign}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {campaign.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === "draft"
                          ? "bg-gray-100 text-gray-800"
                          : campaign.status === "scheduled"
                          ? "bg-yellow-100 text-yellow-800"
                          : campaign.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Subject: {campaign.subject || "No subject"}</p>
                    {campaign.scheduled_for && (
                      <p>
                        Scheduled for:{" "}
                        {new Date(campaign.scheduled_for).toLocaleString()}
                      </p>
                    )}
                    {campaign.sent_at && (
                      <p>Sent: {new Date(campaign.sent_at).toLocaleString()}</p>
                    )}
                  </div>

                  {campaign.stats && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Sent</div>
                        <div className="font-medium">{campaign.stats.sent}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Opened</div>
                        <div className="font-medium">
                          {campaign.stats.opened}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Clicked</div>
                        <div className="font-medium">
                          {campaign.stats.clicked}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/subscribers/campaigns/${campaign.id}`
                      )
                    }
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  {campaign.status === "draft" && (
                    <button
                      onClick={() => {
                        // TODO: Implement preview functionality
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Preview
                    </button>
                  )}
                  {campaign.status === "draft" && (
                    <button
                      onClick={() => {
                        // TODO: Implement schedule functionality
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Schedule
                    </button>
                  )}
                  {campaign.status === "scheduled" && (
                    <button
                      onClick={() => {
                        // TODO: Implement cancel schedule functionality
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel Schedule
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
