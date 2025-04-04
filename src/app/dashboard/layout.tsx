import Link from "next/link";
import { ChevronDown, User, Home, LogOut, LayoutDashboard } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Dashboard Title */}
            <h1 className="text-xl font-semibold text-gray-900">HQ</h1>

            {/* Dropdown with Click Support */}
            <div className="relative">
              {/* Hidden Checkbox to Control Dropdown */}
              <input type="checkbox" id="menu-toggle" className="peer hidden" />

              <label
                htmlFor="menu-toggle"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                <span>Menu</span>
                <ChevronDown className="w-4 h-4" />
              </label>

              {/* Dropdown Menu (Click + Hover) */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md opacity-0 peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </Link>
                <Link
                  href="/"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <Home className="w-4 h-4 mr-2" /> Home
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2" /> Account
                </Link>
                <div className="border-t border-gray-200" />
                <div className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
