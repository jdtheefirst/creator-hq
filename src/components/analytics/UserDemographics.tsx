import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PageViewData {
  device_type: string;
  country: string;
}

interface UserDemographicsProps {
  data: PageViewData[];
}

export default function UserDemographics({ data }: UserDemographicsProps) {
  // Group data by device type
  const deviceData = data.reduce((acc, item) => {
    acc[item.device_type] = (acc[item.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group data by country
  const countryData = data.reduce((acc, item) => {
    acc[item.country] = (acc[item.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort countries by count and get top 5
  const topCountries = Object.entries(countryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const deviceChartData: ChartData<"pie"> = {
    labels: Object.keys(deviceData),
    datasets: [
      {
        data: Object.values(deviceData),
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(245, 158, 11, 0.5)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const deviceChartOptions: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "Device Types",
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-[300px]">
        <Pie data={deviceChartData} options={deviceChartOptions} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
        <div className="space-y-4">
          {topCountries.map(([country, count], index) => (
            <div
              key={country}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{country}</p>
                  <p className="text-sm text-gray-500">
                    {count} {count === 1 ? "view" : "views"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
