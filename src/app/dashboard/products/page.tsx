import Link from "next/link";
import ProductFilters from "@/components/ProductFilters";
import { createClient } from "@/lib/supabase/server";

interface ProductsPageProps {
  searchParams: {
    search?: string;
    category?: string;
    status?: string;
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const supabase = await createClient();

  // Build query based on filters
  let query = supabase
    .from("products")
    .select("*")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .order("created_at", { ascending: false });

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  if (searchParams.category && searchParams.category !== "All") {
    query = query.eq("category", searchParams.category);
  }

  if (searchParams.status && searchParams.status !== "All") {
    query = query.eq("status", searchParams.status);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Products</h1>
          <p className="text-red-600">
            Error loading products. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Get unique categories for filter
  const categories = [
    "All",
    ...new Set(products?.map((p) => p.category) || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Products</h1>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Product
          </Link>
        </div>

        {/* Filters */}
        <ProductFilters
          categories={categories}
          currentCategory={searchParams.category}
          currentStatus={searchParams.status}
          currentSearch={searchParams.search}
        />

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products?.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : product.status === "out_of_stock"
                              ? "bg-red-100 text-red-800"
                              : product.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.sales_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.rating.toFixed(1)} ({product.review_count})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-4">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            // Handle delete
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
