import Link from "next/link";
import ContentManagementLinks from "@/components/dashboard/ContentManagementLinks";
import { createClient } from "@/lib/supabase/server";
import { format, formatDate } from "date-fns";
import { AlertCircle } from "lucide-react";
import QuickActions from "@/components/dashboard/quickActions";

// Temporary dashboard data
const stats = [
  { name: "Total Revenue", value: "$12,345", change: "+12%" },
  { name: "Active Users", value: "1,234", change: "+8%" },
  { name: "New Bookings", value: "45", change: "+15%" },
  { name: "Blog Views", value: "8,901", change: "+23%" },
];

export default async function DashboardPage() {
  // Fetch recent bookings from Supabase
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("creator_id", user.user?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: sessions } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("creator_id", user.user?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="ml-2 text-sm text-green-600">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-4 mb-4">
          <AlertCircle className="text-yellow-500 mt-1" size={24} />
          <div>
            <h2 className="text-2xl font-bold mb-1">Not in your plan</h2>
            <p className="text-muted-foreground">
              Stats insights are only available to recurring clients. Your
              one-time license keeps things simple, but not this simple.
            </p>
            <Link
              href="https://www.upwork.com/freelancers/jdtheefirst"
              className="inline-block bg-black text-white px-5 py-2 rounded-full font-semibold hover:bg-gray-900 transition"
            >
              Reach out to upgrade
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <Link
              href="/dashboard/bookings"
              className="text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="min-w-[700px] table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 px-4 whitespace-nowrap">Name</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Date</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Service</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Status</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td
                      className="py-3 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={booking.id}
                    >
                      {booking.client_name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {format(new Date(booking.booking_date), "yyyy-MM-dd")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {booking.service_type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full capitalize text-sm ${
                          booking.status === "Confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <a
                        href={`/dashboard/bookings/${booking.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Checkout Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Checkouts</h2>
            <Link
              href="/dashboard/sessions"
              className="text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          {!sessions?.length && (
            <div className="p-4 text-center text-muted-foreground">
              No checkout sessions yet.
            </div>
          )}
          <div className="overflow-x-auto w-full">
            <table className="min-w-[700px] table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 px-4 whitespace-nowrap">Session ID</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Amount</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Type</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Status</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Created At</th>
                  <th className="pb-3 px-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sessions?.map((session) => (
                  <tr key={session.id} className="border-b">
                    <td
                      className="py-3 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={session.stripe_session_id}
                    >
                      {session.stripe_session_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {session.total_amount} {session.currency.toUpperCase()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {session.type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-sm capitalize ${
                          session.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : session.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : session.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : session.status === "expired"
                                  ? "bg-gray-200 text-gray-800"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {format(
                        new Date(session.created_at),
                        "yyyy-MM-dd HH:mm:ss"
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <a
                        href={`/dashboard/sessions/${session.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
