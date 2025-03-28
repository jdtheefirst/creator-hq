import Link from "next/link";

// Temporary dashboard data
const stats = [
  { name: "Total Revenue", value: "$12,345", change: "+12%" },
  { name: "Active Users", value: "1,234", change: "+8%" },
  { name: "New Bookings", value: "45", change: "+15%" },
  { name: "Blog Views", value: "8,901", change: "+23%" },
];

const recentBookings = [
  {
    id: 1,
    name: "John Doe",
    date: "2024-03-15",
    service: "Consultation",
    status: "Pending",
  },
  {
    id: 2,
    name: "Jane Smith",
    date: "2024-03-14",
    service: "Workshop",
    status: "Confirmed",
  },
  {
    id: 3,
    name: "Mike Johnson",
    date: "2024-03-13",
    service: "Mentoring",
    status: "Completed",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/dashboard/posts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Post
            </Link>
            <Link
              href="/dashboard/products/new"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Product
            </Link>
          </div>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-3">{booking.name}</td>
                    <td className="py-3">{booking.date}</td>
                    <td className="py-3">{booking.service}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
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
                    <td className="py-3">
                      <button className="text-blue-600 hover:text-blue-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Content Management</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/posts"
                className="block text-blue-600 hover:text-blue-700"
              >
                Manage Blog Posts
              </Link>
              <Link
                href="/dashboard/products"
                className="block text-blue-600 hover:text-blue-700"
              >
                Manage Products
              </Link>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Analytics</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/analytics"
                className="block text-blue-600 hover:text-blue-700"
              >
                View Analytics
              </Link>
              <Link
                href="/dashboard/reports"
                className="block text-blue-600 hover:text-blue-700"
              >
                Generate Reports
              </Link>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/profile"
                className="block text-blue-600 hover:text-blue-700"
              >
                Profile Settings
              </Link>
              <Link
                href="/dashboard/integrations"
                className="block text-blue-600 hover:text-blue-700"
              >
                Integrations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
