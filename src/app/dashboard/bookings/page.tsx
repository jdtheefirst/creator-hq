import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format } from "date-fns";
import BookingFilters from "@/components/BookingFilters";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  service_type: "consultation" | "workshop" | "mentoring" | "other";
  booking_date: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  payment_status: "pending" | "paid" | "refunded";
  meeting_link?: string;
  notes?: string;
}

interface BookingsPageProps {
  searchParams: {
    search?: string;
    status?: string;
    service_type?: string;
    date_from?: string;
    date_to?: string;
  };
}

export default async function BookingsPage({
  searchParams,
}: BookingsPageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Build query based on filters
  let query = supabase
    .from("bookings")
    .select("*")
    .order("booking_date", { ascending: false });

  if (searchParams.search) {
    query = query.or(
      `client_name.ilike.%${searchParams.search}%,client_email.ilike.%${searchParams.search}%`
    );
  }

  if (searchParams.status && searchParams.status !== "All") {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.service_type && searchParams.service_type !== "All") {
    query = query.eq("service_type", searchParams.service_type);
  }

  if (searchParams.date_from) {
    query = query.gte("booking_date", searchParams.date_from);
  }

  if (searchParams.date_to) {
    query = query.lte("booking_date", searchParams.date_to);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error("Error fetching bookings:", error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Bookings</h1>
          <p className="text-red-600">
            Error loading bookings. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Bookings</h1>
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Booking
          </Link>
        </div>

        {/* Filters */}
        <BookingFilters
          currentStatus={searchParams.status}
          currentServiceType={searchParams.service_type}
          currentSearch={searchParams.search}
          currentDateFrom={searchParams.date_from}
          currentDateTo={searchParams.date_to}
        />

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings?.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.client_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.client_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.service_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(
                          new Date(booking.booking_date),
                          "MMM d, yyyy h:mm a"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.duration_minutes} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${booking.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : booking.payment_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-4">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/bookings/${booking.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            // Handle delete
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
