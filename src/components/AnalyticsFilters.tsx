"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

interface AnalyticsFiltersProps {
  currentDateRange?: string;
  currentStartDate?: string;
  currentEndDate?: string;
}

export default function AnalyticsFilters({
  currentDateRange,
  currentStartDate,
  currentEndDate,
}: AnalyticsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateRangeChange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date_range", range);
    params.delete("start_date");
    params.delete("end_date");
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const params = new URLSearchParams(searchParams.toString());
    if (!currentStartDate) {
      params.set("start_date", format(date, "yyyy-MM-dd"));
    } else {
      params.set("end_date", format(date, "yyyy-MM-dd"));
    }
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const dateRanges = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "Last year", value: "1y" },
    { label: "Custom range", value: "custom" },
  ];

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {dateRanges.map((range) => (
          <Button
            key={range.value}
            variant={currentDateRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {(currentDateRange === "custom" ||
        (!currentDateRange && currentStartDate)) && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentStartDate && currentEndDate
                ? `${format(new Date(currentStartDate), "MMM d")} - ${format(
                    new Date(currentEndDate),
                    "MMM d"
                  )}`
                : "Select dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <DayPicker
              mode="range"
              selected={
                currentStartDate && currentEndDate
                  ? {
                      from: new Date(currentStartDate),
                      to: new Date(currentEndDate),
                    }
                  : undefined
              }
              onSelect={(range) => {
                if (range?.from) handleDateSelect(range.from);
                if (range?.to) handleDateSelect(range.to);
              }}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
