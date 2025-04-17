"use client";

import { Product } from "@/types/store";
import { useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { dispatch } = useStore();

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        quantity: 1,
      },
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <Link href={`/store/${product.id}`} className="block">
            {product.thumbnail_url && (
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
          </Link>

          <div className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-600 mt-1 line-clamp-2">
              {product.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold">
                {formatCurrency(product.price, product.currency)}
              </span>
              {product.type === "affiliate" ? (
                <a
                  href={product.affiliate_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                >
                  Buy Now
                </a>
              ) : (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
