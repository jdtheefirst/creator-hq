"use client";

import { SelectIcon } from "@radix-ui/react-select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ProductFiltersProps {
  categories: string[];
  currentCategory?: string;
  currentStatus?: string;
  currentSearch?: string;
}

export default function ProductFilters({
  categories,
  currentCategory,
  currentStatus,
  currentSearch,
}: ProductFiltersProps) {
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

  const handleCategoryChange = (value: string) => {
    router.push(`?${createQueryString("category", value)}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(`?${createQueryString("status", value)}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Products
          </label>
          <input
            type="text"
            id="search"
            value={currentSearch || ""}
            onChange={handleSearch}
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <Select
            value={currentCategory || "All"}
            onValueChange={(value) => handleCategoryChange(value)}
          >
            <SelectTrigger>
              {/* This is the visible part of the select dropdown */}
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {/* Wrap SelectItems within SelectContent */}
              {categories.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <Select
            value={currentStatus || "All"}
            onValueChange={() => handleStatusChange}
          >
            <SelectTrigger>
              {/* This is the visible part of the select dropdown */}
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
