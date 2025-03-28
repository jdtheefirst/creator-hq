import { format } from "date-fns";

interface PageViewData {
  view_date: string;
  page_path: string;
}

interface TopPagesProps {
  data: PageViewData[];
}

export default function TopPages({ data }: TopPagesProps) {
  // Group data by page path and count views
  const pageViews = data.reduce((acc, item) => {
    acc[item.page_path] = (acc[item.page_path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort pages by view count and get top 5
  const topPages = Object.entries(pageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {topPages.map(([path, count], index) => (
        <div
          key={path}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-semibold">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900">{path}</p>
              <p className="text-sm text-gray-500">
                {count} {count === 1 ? "view" : "views"}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {format(
              new Date(
                data.find((item) => item.page_path === path)?.view_date || ""
              ),
              "MMM d"
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
