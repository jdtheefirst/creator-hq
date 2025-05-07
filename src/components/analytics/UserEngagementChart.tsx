"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EngagementData {
  event_date: string;
  event_type: string;
  duration_seconds: number;
}

interface UserEngagementChartProps {
  data: EngagementData[];
}

export default function UserEngagementChart({
  data,
}: UserEngagementChartProps) {
  // Group data by date and event type
  const groupedData = data.reduce(
    (acc, item) => {
      const date = format(new Date(item.event_date), "MMM d");
      if (!acc[date]) {
        acc[date] = {
          page_view: 0,
          click: 0,
          scroll: 0,
          hover: 0,
        };
      }
      if (
        item.event_type === "page_view" ||
        item.event_type === "click" ||
        item.event_type === "scroll" ||
        item.event_type === "hover"
      ) {
        acc[date][item.event_type]++;
      }
      return acc;
    },
    {} as Record<
      string,
      { page_view: number; click: number; scroll: number; hover: number }
    >
  );

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: "Page Views",
        data: Object.values(groupedData).map((item) => item.page_view),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.4,
      },
      {
        label: "Clicks",
        data: Object.values(groupedData).map((item) => item.click),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        tension: 0.4,
      },
      {
        label: "Scrolls",
        data: Object.values(groupedData).map((item) => item.scroll),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        tension: 0.4,
      },
      {
        label: "Hovers",
        data: Object.values(groupedData).map((item) => item.hover),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
