import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PageViewData {
  view_date: string;
  page_path: string;
  device_type: string;
}

interface PageViewsChartProps {
  data: PageViewData[];
}

export default function PageViewsChart({ data }: PageViewsChartProps) {
  // Group data by date and device type
  const groupedData = data.reduce((acc, item) => {
    const date = format(new Date(item.view_date), "MMM d");
    if (!acc[date]) {
      acc[date] = {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      };
    }
    acc[date][item.device_type.toLowerCase()]++;
    return acc;
  }, {} as Record<string, { desktop: number; mobile: number; tablet: number }>);

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: "Desktop",
        data: Object.values(groupedData).map((item) => item.desktop),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "Mobile",
        data: Object.values(groupedData).map((item) => item.mobile),
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
      {
        label: "Tablet",
        data: Object.values(groupedData).map((item) => item.tablet),
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        borderColor: "rgb(245, 158, 11)",
        borderWidth: 1,
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
        stacked: true,
      },
      x: {
        stacked: true,
      },
    },
  };

  return (
    <div className="h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
