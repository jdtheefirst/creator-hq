"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface BookingFiltersProps {
  currentStatus?: string;
  currentServiceType?: string;
  currentSearch?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

export default function BookingFilters({
  currentStatus,
  currentServiceType,
  currentSearch,
  currentDateFrom,
  currentDateTo,
}: BookingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("search", value)}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("status", value)}`);
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("service_type", value)}`);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("date_from", value)}`);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("date_to", value)}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="search"
            value={currentSearch || ""}
            onChange={handleSearch}
            placeholder="Search by name or email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={currentStatus || "All"}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Service Type Filter */}
        <div>
          <label
            htmlFor="service_type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Service Type
          </label>
          <select
            id="service_type"
            value={currentServiceType || "All"}
            onChange={handleServiceTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Services</option>
            <option value="consultation">Consultation</option>
            <option value="workshop">Workshop</option>
            <option value="mentoring">Mentoring</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date Range Filters */}
        <div>
          <label
            htmlFor="date_from"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            From Date
          </label>
          <input
            type="date"
            id="date_from"
            value={currentDateFrom || ""}
            onChange={handleDateFromChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="date_to"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            To Date
          </label>
          <input
            type="date"
            id="date_to"
            value={currentDateTo || ""}
            onChange={handleDateToChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
