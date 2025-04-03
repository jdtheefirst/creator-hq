import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function ContentManagementLinks() {
  return (
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

      <div className="relative">
        <input type="checkbox" id="content-toggle" className="peer hidden" />

        <label
          htmlFor="content-toggle"
          className="flex items-center text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <span>See More</span>
          <ChevronDown className="ml-1 w-4 h-4 transition-transform peer-checked:rotate-180" />
        </label>

        <div
          className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 
          opacity-0 peer-checked:opacity-100 peer-checked:pointer-events-auto 
          transition-opacity duration-200 pointer-events-none 
          group-hover:opacity-100 z-50"
        >
          <Link
            href="/dashboard/videos"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Manage Videos
          </Link>
          <Link
            href="/dashboard/vip"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            VIP Content
          </Link>
          <Link
            href="/dashboard/podcasts"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Manage Podcasts
          </Link>
          <Link
            href="/dashboard/courses"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Manage Courses
          </Link>
          <Link
            href="/dashboard/lyrics"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Manage Lyrics
          </Link>
          <Link
            href="/dashboard/subscribers"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Manage Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}
