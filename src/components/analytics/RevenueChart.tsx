"use client";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";

interface RevenueMetrics {
  date: string;
  total_revenue: number;
  bookings_revenue: number;
  products_revenue: number;
}

interface RevenueChartProps {
  data: RevenueMetrics[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = {
    labels: data.map((d) => format(new Date(d.date), "MMM d")),
    datasets: [
      {
        label: "Total Revenue",
        data: data.map((d) => d.total_revenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
      },
      {
        label: "Bookings Revenue",
        data: data.map((d) => d.bookings_revenue),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
      },
      {
        label: "Products Revenue",
        data: data.map((d) => d.products_revenue),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `$${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
